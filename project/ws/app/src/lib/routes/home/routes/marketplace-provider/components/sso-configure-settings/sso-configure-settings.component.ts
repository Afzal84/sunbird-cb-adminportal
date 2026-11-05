import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core'
import { Clipboard } from '@angular/cdk/clipboard'
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms'
import { MarketplaceService } from '../../services/marketplace.service'
import { SsoConfiguration } from '../../models/configure-provider.model'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { GlobalEventsService } from '../../../../../../../../../../../src/app/services/global-events.service'
import { ActivatedRoute, Router } from '@angular/router'
import * as _ from 'lodash'

export type SettingsType = 'sso' | 'LTI'

@Component({
  selector: 'ws-app-sso-configure-settings',
  templateUrl: './sso-configure-settings.component.html',
  styleUrls: ['./sso-configure-settings.component.scss'],
  standalone: false
})
export class SsoConfigureSettingsComponent implements OnInit, OnChanges {
  @Input() providerDetails: any
  @Output() loadSSODetails = new EventEmitter<any>()

  callbackUrlCopied = false
  redirectUrlCopied = false
  testSSOConnectionVisible = false

  ssoProtocolsList = [{
    name: 'SAML', value: 'saml'
  }]
  ssoSettingsForm!: FormGroup

  settingsOptions: Array<{ name: string, value: SettingsType }> = [
    { name: 'SSO integration', value: 'sso' },
    { name: 'LTI support', value: 'LTI' },
  ]
  settingsType: SettingsType = 'sso'
  ltiForm!: FormGroup
  // Backend-provided identity controls; added (disabled) only for a saved LTI provider
  readonly ltiReadonlyKeys = ['ltiVersion', 'toolIssuer', 'clientId', 'deploymentId']
  showLtiReadonlyFields = false

  initialFormValue: any = {}
  initialAcsUrl = ''
  initialSsoTestUrl = ''
  initialStatus = false

  acsUrl = new FormControl('', [Validators.required, this.urlValidator()])
  ssoTestUrl = new FormControl('', [Validators.required, this.urlValidator()])
  status = new FormControl(false)
  attributesOptionsList = []

  get mappersFormArray() {
    return this.ssoSettingsForm.get('mappers') as FormArray
  }

  SSOConfigurationData: SsoConfiguration | null = null
  constructor(private clipboard: Clipboard, private formBuilder: FormBuilder, private marketplaceService: MarketplaceService, private snackBar: MatSnackBar,
    private loaderService: GlobalEventsService, private router: Router,
    private activateRoute: ActivatedRoute,

  ) {
    this.ssoSettingsForm = this.formBuilder.group({})
    this.ltiForm = this.buildLtiForm()
  }

  buildLtiForm(): FormGroup {
    return this.formBuilder.group({
      toolPublicJwksUrl: ['', [Validators.required, this.urlValidator()]],
      oidcLoginInitiationUrl: ['', [Validators.required, this.urlValidator()]],
      redirectLaunchUrl: ['', [Validators.required, this.urlValidator()]],
      deepLinkingUrl: ['', [this.urlValidator()]],
    })
  }

  get activeForm(): FormGroup {
    return this.settingsType === 'LTI' ? this.ltiForm : this.ssoSettingsForm
  }

  onSettingsChange(next: SettingsType) {
    if (next === this.settingsType) {
      return
    }
    if (this.activeForm.dirty) {
      console.warn('Switching the settings type will result in losing unsaved changes made in the current form.')
    }
    this.settingsType = next
  }

  get savedProtocol(): string {
    return `${this.providerDetails?.data?.protocol || ''}`.trim().toUpperCase()
  }

  // Once a protocol has been saved on the provider it cannot be changed
  get isProtocolLocked(): boolean {
    return !!this.isSavedConfiguration
  }

  get isSavedConfiguration(): boolean {
    return this.settingsType === 'LTI' ? this.savedProtocol === 'LTI' : !!this.SSOConfigurationData
  }

  // Selects the settings type from the provider's saved `protocol`.
  // Returns true when the provider is an LTI provider (its form is patched).
  applyProviderProtocol(): boolean {
    if (this.savedProtocol === 'LTI') {
      if (!this.ltiForm.dirty) {
        this.patchLtiForm(this.providerDetails?.data?.ltiConfiguration || {})
      }
      this.settingsType = 'LTI'
      return true
    }
    if (this.savedProtocol) {
      this.settingsType = 'sso'
    }
    return false
  }

  // Patches the editable LTI controls and, when the API returned them, adds the read-only identity controls
  patchLtiForm(config: { [key: string]: any }) {
    this.ltiForm.patchValue({
      toolPublicJwksUrl: config['toolPublicJwksUrl'] ?? '',
      oidcLoginInitiationUrl: config['oidcLoginInitiationUrl'] ?? '',
      redirectLaunchUrl: config['redirectLaunchUrl'] ?? '',
      deepLinkingUrl: config['deepLinkingUrl'] ?? '',
    })
    this.ltiReadonlyKeys.forEach(key => {
      if (!config[key]) {
        return
      }
      if (!this.ltiForm.get(key)) {
        this.ltiForm.addControl(key, new FormControl({ value: config[key], disabled: true }))
      } else {
        this.ltiForm.get(key)!.setValue(config[key])
      }
    })
    this.showLtiReadonlyFields = this.savedProtocol === 'LTI' && this.ltiReadonlyKeys.some(key => !!this.ltiForm.get(key))
    this.ltiForm.markAsPristine()
  }

  get canSaveLti(): boolean {
    // Validity is checked on click so that errors are shown for an invalid save attempt
    return this.ltiForm.dirty
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['providerDetails'] && !changes['providerDetails'].firstChange) {
      this.applyProviderProtocol()
    }
  }

  ngOnInit(): void {
    this.initializeForm()
    this.fetchSSOSettings()
  }

  initializeForm() {
    this.activateRoute.data.subscribe(data => {
      if (data.pageData.data) {
        this.attributesOptionsList = _.get(data, 'pageData.data.SSO_attributs', [])
      }
    })
    this.ssoSettingsForm = this.formBuilder.group({
      clientId: ['', [Validators.required]],
      partnerName: ['', [Validators.required]],
      ssoProtocol: ['saml', [Validators.required]],
      ssoUrl: ['', [Validators.required, this.urlValidator()]],
      mappers: this.formBuilder.array([])
    })

  }

  addMappers() {
    if (this.isLastMapperFilled()) {
      const mappers = this.mappersFormArray
      mappers.push(this.createMapperGroup())
      this.ssoSettingsForm.markAsTouched()
      this.ssoSettingsForm.markAsDirty()
    }
  }

  isLastMapperFilled(): boolean {
    const mappers = this.mappersFormArray
    if (mappers.length === 0) return true

    const lastMapper = mappers.at(mappers.length - 1)
    const key = lastMapper.get('key')?.value
    const value = lastMapper.get('value')?.value

    return key && value
  }

  canAddMapper(): boolean {
    return this.isLastMapperFilled()
  }

  removeMapper(index: number) {
    this.mappersFormArray.removeAt(index)
    this.ssoSettingsForm.markAsTouched()
    this.ssoSettingsForm.markAsDirty()
  }

  createMapperGroup(): FormGroup {
    return this.formBuilder.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    })
  }

  addEmptyMapperIfNone() {
    if (this.mappersFormArray.length === 0) {
      this.mappersFormArray.push(this.createMapperGroup())
    }
  }

  get isSaveDisabled(): boolean {
    if (this.settingsType === 'LTI') {
      return !this.ltiForm.dirty
    }
    const currentForm = this.ssoSettingsForm.getRawValue()
    return JSON.stringify(currentForm) === JSON.stringify(this.initialFormValue) &&
      this.acsUrl.value === this.initialAcsUrl &&
      this.ssoTestUrl.value === this.initialSsoTestUrl &&
      this.status.value === this.initialStatus
  }

  copy(type: string, value: string) {
    this.clipboard.copy(value)
    switch (type) {
      case 'callback':
        this.callbackUrlCopied = true
        setTimeout(() => this.callbackUrlCopied = false, 1000)
        break
      case 'redirect':
        this.redirectUrlCopied = true
        setTimeout(() => this.redirectUrlCopied = false, 1000)
        break

    }
  }

  fetchSSOSettings() {
    if (this.providerDetails && this.providerDetails.id) {
      if (this.applyProviderProtocol()) {
        // LTI provider: SSO configuration is not applicable, so skip the SSO API
        return
      }
      this.loaderService.setLoaderState(true)
      this.ssoSettingsForm.controls['partnerName'].setValue(this.providerDetails?.data?.contentPartnerName || '')
      this.ssoSettingsForm.controls['partnerName'].disable()

      this.addEmptyMapperIfNone()

      this.marketplaceService.getSSOConfiguration(this.providerDetails.id).subscribe({
        next: (response: any) => {
          if (response && response.params?.status === 'success' && Object.keys(response?.result?.ssoData || {}).length > 0) {
            this.SSOConfigurationData = response?.result?.ssoData
            this.loadSSODetails.emit(this.SSOConfigurationData)

            const { mappers } = this.SSOConfigurationData || {}
            this.ssoSettingsForm.patchValue({
              clientId: this.SSOConfigurationData?.clientId,
              ssoProtocol: this.SSOConfigurationData?.ssoProtocol,
              ssoUrl: this.SSOConfigurationData?.ssoUrl,
              emailAttribute: this.SSOConfigurationData?.emailAttribute,
              firstNameAttribute: this.SSOConfigurationData?.firstNameAttribute,
              lastNameAttribute: this.SSOConfigurationData?.lastNameAttribute,
              userIdAttribute: this.SSOConfigurationData?.userIdAttribute,
            })

            this.populateMappers(mappers || [])

            this.status.setValue(this.SSOConfigurationData?.status || false)
            this.acsUrl.setValue(this.SSOConfigurationData?.acsUrl || '')
            this.ssoTestUrl.setValue(this.SSOConfigurationData?.ssoTestUrl || '')

            // Set initial values for comparison to properly enable/disable save button
            this.initialFormValue = {
              clientId: this.SSOConfigurationData?.clientId || '',
              partnerName: this.providerDetails?.data?.contentPartnerName || '',
              ssoProtocol: this.SSOConfigurationData?.ssoProtocol || 'saml',
              ssoUrl: this.SSOConfigurationData?.ssoUrl || '',
              emailAttribute: this.SSOConfigurationData?.emailAttribute || '',
              firstNameAttribute: this.SSOConfigurationData?.firstNameAttribute || '',
              lastNameAttribute: this.SSOConfigurationData?.lastNameAttribute || '',
              userIdAttribute: this.SSOConfigurationData?.userIdAttribute || '',
              mappers: this.SSOConfigurationData?.mappers || {},
            }
            this.initialAcsUrl = this.SSOConfigurationData?.acsUrl || ''
            this.initialSsoTestUrl = this.SSOConfigurationData?.ssoTestUrl || ''
            this.initialStatus = this.SSOConfigurationData?.status || false
          }
          this.loaderService.setLoaderState(false)

        }, error: () => {
          this.loaderService.setLoaderState(false)
        }
      })
    }
  }

  createSSOConfigurations() {
    if (this.ssoSettingsForm.invalid || this.acsUrl.invalid || this.ssoTestUrl.invalid) {
      this.ssoSettingsForm.markAllAsTouched()
      this.acsUrl.markAllAsTouched()
      this.ssoTestUrl.markAllAsTouched()
      return
    }
    this.loaderService.setLoaderState(true)
    const formValues = this.ssoSettingsForm.getRawValue()
    const payload = {
      ...formValues,
      mappers: this.getMappersValue(),
      status: this.status.value,
      acsUrl: this.acsUrl.value,
      ssoTestUrl: this.ssoTestUrl.value,
    }

    this.marketplaceService.createSSOConfiguration(this.providerDetails.id, payload).subscribe({
      next: (response: any) => {
        if (response && response.params?.status === 'success') {
          this.fetchSSOSettings()
          this.showSnackBar('SSO Configuration created successfully', 'success')
        } else {
          this.showSnackBar(response?.params?.errmsg || 'Failed to create SSO Configuration', 'error')
        }
        this.loaderService.setLoaderState(false)
      }, error: (error: any) => {
        this.showSnackBar(this.extractErrorMessage(error?.error?.message), 'error')
        this.loaderService.setLoaderState(false)
      }
    })
  }

  updateSSOConfigurations() {
    if (this.ssoSettingsForm.invalid) {
      this.ssoSettingsForm.markAllAsTouched()
      return
    }
    this.loaderService.setLoaderState(true)

    const formValues = this.ssoSettingsForm.getRawValue()

    // Check if any control (except status) is touched or dirty
    const anyOtherControlTouchedOrDirty =
      this.ssoSettingsForm.touched ||
      this.ssoSettingsForm.dirty ||
      this.acsUrl.touched ||
      this.acsUrl.dirty ||
      this.ssoTestUrl.touched ||
      this.ssoTestUrl.dirty

    const payload = {
      ...formValues,
      mappers: this.getMappersValue(),
      status: this.status.value,
      acsUrl: this.acsUrl.value,
      ssoTestUrl: this.ssoTestUrl.value,
      ssoId: this.SSOConfigurationData?.ssoId || '',
      // configuration: this.SSOConfigurationData?.configuration || '',
      configuration: anyOtherControlTouchedOrDirty ? 'incomplete' : this.SSOConfigurationData?.configuration,

      includeAuthnStatement: this.SSOConfigurationData?.includeAuthnStatement,
      signDocuments: this.SSOConfigurationData?.signDocuments,
      optimizeRedirectSigningKeyLookup: this.SSOConfigurationData?.optimizeRedirectSigningKeyLookup,
      signAssertions: this.SSOConfigurationData?.signAssertions,
      signatureAlgorithm: this.SSOConfigurationData?.signatureAlgorithm,
      samlSignatureKeyName: this.SSOConfigurationData?.samlSignatureKeyName,
      forcePOSTBinding: this.SSOConfigurationData?.forcePOSTBinding,
      encryptAssertions: this.SSOConfigurationData?.encryptAssertions,
      forceNameIdFormat: this.SSOConfigurationData?.forceNameIdFormat,
      clientSignatureRequired: this.SSOConfigurationData?.clientSignatureRequired,
      nameIdFormat: this.SSOConfigurationData?.nameIdFormat,
      rootUrl: this.SSOConfigurationData?.rootUrl,
      validRedirectUrls: this.SSOConfigurationData?.validRedirectUrls || []
    }

    if (this.SSOConfigurationData?.ssoTested !== undefined) {
      payload['ssoTested'] = anyOtherControlTouchedOrDirty ? false : this.SSOConfigurationData.ssoTested
    }

    this.marketplaceService.updateSSOConfiguration(this.providerDetails.id, payload).subscribe({
      next: (response: any) => {
        if (response && response.params?.status === 'success') {
          this.fetchSSOSettings()
          this.showSnackBar('SSO Configuration updated successfully', 'success')

          // Mark all controls as not touched and not dirty
          this.ssoSettingsForm.markAsUntouched()
          this.ssoSettingsForm.markAsPristine()
          this.acsUrl.markAsUntouched()
          this.acsUrl.markAsPristine()
          this.ssoTestUrl.markAsUntouched()
          this.ssoTestUrl.markAsPristine()
          this.status.markAsUntouched()
          this.status.markAsPristine()
        } else {
          this.showSnackBar(response?.params?.errmsg || 'Failed to update SSO Configuration', 'error')
        }
        this.loaderService.setLoaderState(false)

      }, error: (error: any) => {
        this.showSnackBar(this.extractErrorMessage(error?.error?.message), 'error')
        this.loaderService.setLoaderState(false)
      }
    })
  }

  updateCreateSSO() {
    if (this.SSOConfigurationData) {
      this.updateSSOConfigurations()
    } else {
      this.createSSOConfigurations()
    }
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

  extractErrorMessage(error: any): string {
    if (!error) {
      return 'Something went wrong'
    }

    if (typeof error === 'object' && error.errorMessage) {
      return error.errorMessage
    }

    if (typeof error === 'string') {
      try {
        const start = error.indexOf('{')
        const end = error.lastIndexOf('}')
        if (start !== -1 && end > start) {
          const parsed = JSON.parse(error.slice(start, end + 1))
          return parsed.errorMessage || error
        }
      } catch {
        return error
      }
    }

    return 'Something went wrong'
  }

  navigateToProvidersDashboard() {
    this.router.navigateByUrl('/app/home/marketplace-providers')
  }

  urlValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null

      try {
        const url = new URL(control.value)
        const hostname = url.hostname

        const parts = hostname.split('.')

        const isValid =
          parts.length >= 2 &&
          !hostname.endsWith('.') &&
          parts[parts.length - 1].length >= 2

        return isValid ? null : { invalidUrl: true }
      } catch {
        return { invalidUrl: true }
      }
    }
  }

  populateMappers(mappers: Array<{ key: string, value: string }> | { [key: string]: string }) {
    const mappersFormArray = this.mappersFormArray
    mappersFormArray.clear()

    if (mappers) {
      if (Array.isArray(mappers)) {
        if (mappers.length > 0) {
          mappers.forEach(mapper => {
            mappersFormArray.push(
              this.formBuilder.group({
                key: [mapper.key, Validators.required],
                value: [mapper.value, Validators.required]
              })
            )
          })
        }
      } else {
        Object.entries(mappers).forEach(([key, value]) => {
          mappersFormArray.push(
            this.formBuilder.group({
              key: [key, Validators.required],
              value: [value, Validators.required]
            })
          )
        })
      }
    }

    if (mappersFormArray.length === 0) {
      this.addMappers()
    }
  }

  getMappersValue(): { [key: string]: string } {
    const result: { [key: string]: string } = {}

    this.mappersFormArray.controls.forEach((control: any) => {
      const key = control.get('key')?.value
      const value = control.get('value')?.value

      if (key && value) {
        result[key] = value
      }
    })

    return result
  }
}
