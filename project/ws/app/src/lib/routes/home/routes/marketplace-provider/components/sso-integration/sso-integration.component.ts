import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { SsoConfigureSettingsComponent } from '../sso-configure-settings/sso-configure-settings.component'
import { SsoConfiguration } from '../../models/configure-provider.model'
import { MatDialog } from '@angular/material/dialog'
import { LoadingPopupComponent } from '../../dialogs/loading-popup/loading-popup.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { HttpErrorResponse } from '@angular/common/http'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as _ from 'lodash'
import { forkJoin, Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'


@Component({
  selector: 'ws-app-sso-integration',
  templateUrl: './sso-integration.component.html',
  styleUrls: ['./sso-integration.component.scss'],
  standalone: false
})
export class SsoIntegrationComponent implements OnInit {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  @ViewChild('ssoConfigurationSettings') ssoConfigurationSettings!: SsoConfigureSettingsComponent
  ssoConfigurations: SsoConfiguration | null = null
  providerResponse: any
  selectedTabIndex = 0

  helpCenterGuide = {
    header: 'Note:- Content Upload Details: Video Guides and Tips.',
    guideNotes: [],
    helpVideoLink: `/assets/public/content/guide-videos/CIOS_Updated_demo.mp4`,
  }

  constructor(private dialog: MatDialog, private marketplaceService: MarketplaceService, private snackBar: MatSnackBar,) { }

  ngOnInit(): void {
  }

  updateCreateSSO() {
    if (this.ssoConfigurationSettings) {
      if (this.ssoConfigurationSettings.settingsType === 'LTI') {
        this.saveLtiConfiguration()
      } else if (this.ssoConfigurationSettings.SSOConfigurationData) {
        this.ssoConfigurationSettings.updateSSOConfigurations()
      } else {
        this.ssoConfigurationSettings.createSSOConfigurations()
      }
    }
  }

  saveLtiConfiguration() {
    const ltiForm = this.ssoConfigurationSettings.ltiForm
    if (ltiForm.invalid) {
      ltiForm.markAllAsTouched()
      return
    }

    const payload = {
      ...this.providerDetails,
      data: {
        ...this.providerDetails?.data,
        protocol: 'LTI',
        ltiConfiguration: {
          toolPublicJwksUrl: ltiForm.get('toolPublicJwksUrl')?.value,
          oidcLoginInitiationUrl: ltiForm.get('oidcLoginInitiationUrl')?.value,
          redirectLaunchUrl: ltiForm.get('redirectLaunchUrl')?.value,
          deepLinkingUrl: ltiForm.get('deepLinkingUrl')?.value || '',
        },
      },
    }

    this.marketplaceService.updateProvider(payload).subscribe({
      next: (response: any) => {
        if (response && response.params?.status === 'success') {
          ltiForm.markAsPristine()
          ltiForm.markAsUntouched()
          this.showSnackBar('LTI configuration saved successfully', 'success')
          this.loadProviderDetails.emit(true)
          this.providerResponse = response?.result
        } else {
          this.showSnackBar(response?.params?.errMsg || 'Failed to save LTI configuration', 'error')
        }
      },
      error: (error: HttpErrorResponse) => {
        this.showSnackBar(_.get(error, 'error.params.errMsg', 'Something went wrong, please try again later'), 'error')
      }
    })
  }

  loadSSODetails(event: any) {
    this.ssoConfigurations = event
    this.loadProviderDetails.emit({ ...this.providerDetails, ssoDetails: event })
  }

  get isSSOSuccessfullyConfigured(): boolean {
    return (
      this.providerDetails?.data?.isAuthenticate &&
      this.providerDetails?.data?.isActive &&
      this.ssoConfigurations?.configuration === 'completed' &&
      this.ssoConfigurations?.ssoTested
    )
  }

  get enableTestSSOButton(): boolean {
    if (this.ssoConfigurationSettings) {
      if (this.providerDetails?.data?.protocol === 'LTI') {
        return true
      } else if (!this.ssoConfigurations?.ssoTestUrl) {
        return true
      }
    }
    return false
  }

  // Placeholder data until the LTI test launch API is available
  // ltiTestSteps: Array<{ displayText: string, isPass: boolean }> = [
  //   { displayText: 'OIDC Login Initiation', isPass: true },
  //   { displayText: 'Authentication Request', isPass: true },
  //   { displayText: 'ID Token Received', isPass: true },
  //   { displayText: 'Signature Verified (JWKS)', isPass: true },
  //   { displayText: 'Claims Validated (iss/aud/nonce/exp)', isPass: false },
  // ]
  // ltiTestErrorMessage = 'Test launch failed at step: Claims Validated. Reason: nonce mismatch. Provider cannot be activated until this passes.'

  get isLtiSelected(): boolean {
    return this.ssoConfigurationSettings?.settingsType === 'LTI'
  }

  // get hasLtiTestFailure(): boolean {
  //   return this.ltiTestSteps.some(step => !step.isPass)
  // }

  get canSave(): boolean {
    if (!this.ssoConfigurationSettings) {
      return false
    }

    if (this.ssoConfigurationSettings.settingsType === 'LTI') {
      return this.ssoConfigurationSettings.canSaveLti
    }

    const { ssoSettingsForm, acsUrl, ssoTestUrl, status, isSaveDisabled } = this.ssoConfigurationSettings

    const allValid = ssoSettingsForm.valid && acsUrl.valid && ssoTestUrl.valid && status.valid

    const anyTouched = ssoSettingsForm.touched || acsUrl.touched || ssoTestUrl.touched || status.touched
    const isDirty = ssoSettingsForm.dirty || acsUrl.dirty || ssoTestUrl.dirty || status.dirty

    return !isSaveDisabled && allValid && (anyTouched || isDirty)
  }

  testSsoUrl() {
    const dialogRef = this.dialog.open(LoadingPopupComponent, {
      autoFocus: false,
      width: '345px',
      height: '164px',
      maxWidth: '80vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        title: 'Testing SSO Connection',
        subtitle: "Wait a second, It's processing…"
      }
    })

    if (this.isLtiSelected) {
      this.testLtiConfiguration(dialogRef)
    } else {
      this.testSSOConfiguration(dialogRef)
    }


  }

  testSSOConfiguration(dialogRef: any) {
    const ssoPayload = {
      ...this.ssoConfigurations,
      ssoTested: true,
      configuration: 'completed'
    }


    const providerPayload = {
      ...this.providerDetails,
    }
    providerPayload.data.isAuthenticate = true


    const testPayload = {
      courseDeeplink: _.get(this.ssoConfigurationSettings, 'SSOConfigurationData.ssoTestUrl', ''),
      ssoId: _.get(this.ssoConfigurationSettings, 'SSOConfigurationData.ssoId', ''),
    }

    this.marketplaceService.testSSOConfiguration(testPayload).pipe(
      mergeMap((testResponse: any) => {
        // Check if testSSOConfiguration response has failed status
        if (testResponse?.responseCode !== 'OK') {
          return new Observable((observer) => {
            observer.error({
              error: {
                params: {
                  errMsg: testResponse?.params?.errmsg || 'SSO configuration test failed'
                }
              }
            })
          })
        }

        // If test passed, continue with forkJoin
        return forkJoin({
          ssoResponse: this.marketplaceService.updateSSOConfiguration(
            this.providerDetails?.id,
            ssoPayload
          ),
          providerResponse: this.marketplaceService.updateProvider(providerPayload)
        })
      })
    ).subscribe({
      next: ({ ssoResponse, providerResponse }: any) => {
        if (ssoResponse?.result?.ssoData) {
          this.ssoConfigurations = ssoResponse.result.ssoData
          this.providerResponse = providerResponse?.result
        }

        setTimeout(() => {
          dialogRef.close()
          this.ssoConfigurationSettings?.fetchSSOSettings()
          this.loadProviderDetails.emit(true)
        }, 1000)
      },
      error: (error: HttpErrorResponse) => {
        dialogRef.close()
        const errmsg = _.get(error,
          'error.params.errmsg',
          'Something went wrong, please try again later'
        )
        this.showSnackBar(errmsg, 'error')
      }
    })
  }

  testLtiConfiguration(dialogRef: any) {
    const providerPayload = {
      ...this.providerDetails,
    }
    this.marketplaceService.ltiSSOTest(this.providerDetails?.data?.partnerCode).pipe(
      mergeMap((testResponse: any) => {
        let errorMessage = 'LTI configuration test failed'
        let status = 'Failed'
        if (testResponse?.responseCode === 'OK') {
          status = _.get(testResponse, 'params.status', false)
          errorMessage = _.get(testResponse, 'params.errmsg', errorMessage)
        }
        if (providerPayload.data?.ltiConfiguration) {
          ['ltiVersion', 'toolIssuer', 'clientId', 'deploymentId'].forEach(key => {
            delete providerPayload.data.ltiConfiguration[key]
          })
          providerPayload.data.ltiConfiguration['ssoTestStatus'] = status
          providerPayload.data.ltiConfiguration['message'] = errorMessage
          if (status.toLocaleLowerCase() === 'success') {
            providerPayload.data.isAuthenticate = true
          }
        }
        return this.marketplaceService.updateProvider(providerPayload)
      })
    ).subscribe({
      next: (response: any) => {
        dialogRef.close()
        if (response?.responseCode !== 'OK') {
          this.showSnackBar('LTI test failed', 'error')
        } else {
          this.showSnackBar('LTI test passed', 'success')
        }
      },
      error: (error: HttpErrorResponse) => {
        dialogRef.close()
        const errmsg = _.get(error,
          'error.params.errmsg',
          'Something went wrong, please try again later'
        )
        this.showSnackBar(errmsg, 'error')
      }
    })
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }
}
