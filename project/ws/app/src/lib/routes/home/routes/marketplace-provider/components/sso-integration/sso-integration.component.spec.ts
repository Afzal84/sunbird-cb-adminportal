import { FormControl, FormGroup, Validators } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { SsoIntegrationComponent } from './sso-integration.component'

describe('SsoIntegrationComponent', () => {
  let component: SsoIntegrationComponent
  let marketplaceService: any
  let dialog: any
  let snackBar: any
  let dialogRef: any

  const makeLtiSettings = (value: any = {}): any => ({
    settingsType: 'LTI',
    ltiForm: new FormGroup({
      toolPublicJwksUrl: new FormControl(value.toolPublicJwksUrl ?? 'https://example.com/jwks', Validators.required),
      oidcLoginInitiationUrl: new FormControl(value.oidcLoginInitiationUrl ?? 'https://example.com/login', Validators.required),
      redirectLaunchUrl: new FormControl(value.redirectLaunchUrl ?? 'https://example.com/launch', Validators.required),
      deepLinkingUrl: new FormControl(value.deepLinkingUrl ?? ''),
    }),
    canSaveLti: true,
    SSOConfigurationData: null,
    updateSSOConfigurations: jest.fn(),
    createSSOConfigurations: jest.fn(),
    fetchSSOSettings: jest.fn(),
  })

  const makeSsoSettings = (overrides: any = {}): any => ({
    settingsType: 'sso',
    ssoSettingsForm: new FormGroup({}),
    acsUrl: new FormControl(''),
    ssoTestUrl: new FormControl(''),
    status: new FormControl(false),
    isSaveDisabled: false,
    SSOConfigurationData: null,
    updateSSOConfigurations: jest.fn(),
    createSSOConfigurations: jest.fn(),
    fetchSSOSettings: jest.fn(),
    ...overrides,
  })

  beforeEach(() => {
    dialogRef = { close: jest.fn() }
    dialog = { open: jest.fn().mockReturnValue(dialogRef) }
    marketplaceService = {
      testSSOConfiguration: jest.fn().mockReturnValue(of({ responseCode: 'OK' })),
      ltiSSOTest: jest.fn().mockReturnValue(of({ responseCode: 'OK', params: { status: 'Success' } })),
      updateProvider: jest.fn().mockReturnValue(of({ responseCode: 'OK', result: { id: 'r1' } })),
      updateSSOConfiguration: jest.fn().mockReturnValue(of({ result: { ssoData: { ssoId: 's1' } } })),
    }
    snackBar = { openFromComponent: jest.fn() }
    component = new SsoIntegrationComponent(dialog, marketplaceService, snackBar)
    component.providerDetails = { id: 'p1', data: { partnerCode: 'pc', contentPartnerName: 'P' } }
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create and run ngOnInit', () => {
    expect(component).toBeTruthy()
    expect(component.ngOnInit()).toBeUndefined()
  })

  describe('updateCreateSSO', () => {
    it('should do nothing without settings', () => {
      expect(() => component.updateCreateSSO()).not.toThrow()
    })

    it('should call update when an SSO configuration exists', () => {
      const settings = makeSsoSettings({ SSOConfigurationData: {} })
      component.ssoConfigurationSettings = settings
      component.updateCreateSSO()
      expect(settings.updateSSOConfigurations).toHaveBeenCalled()
    })

    it('should call create when no SSO configuration exists', () => {
      const settings = makeSsoSettings()
      component.ssoConfigurationSettings = settings
      component.updateCreateSSO()
      expect(settings.createSSOConfigurations).toHaveBeenCalled()
    })

    it('should save LTI configuration for LTI settings', () => {
      const spy = jest.spyOn(component, 'saveLtiConfiguration').mockImplementation(() => undefined)
      component.ssoConfigurationSettings = makeLtiSettings()
      component.updateCreateSSO()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('saveLtiConfiguration', () => {
    it('should mark touched and skip the API when the form is invalid', () => {
      const settings = makeLtiSettings({ toolPublicJwksUrl: '' })
      component.ssoConfigurationSettings = settings
      component.saveLtiConfiguration()
      expect(settings.ltiForm.get('toolPublicJwksUrl').touched).toBe(true)
      expect(marketplaceService.updateProvider).not.toHaveBeenCalled()
    })

    it('should save, notify and emit on success', () => {
      const settings = makeLtiSettings({ deepLinkingUrl: 'https://example.com/dl' })
      settings.ltiForm.markAsDirty()
      component.ssoConfigurationSettings = settings
      const emitted = jest.fn()
      component.loadProviderDetails.subscribe(emitted)
      marketplaceService.updateProvider.mockReturnValue(of({ params: { status: 'success' }, result: { id: 'r' } }))
      component.saveLtiConfiguration()
      expect(marketplaceService.updateProvider.mock.calls[0][0].data.ltiConfiguration.deepLinkingUrl).toBe('https://example.com/dl')
      expect(settings.ltiForm.dirty).toBe(false)
      expect(emitted).toHaveBeenCalledWith(true)
      expect(component.providerResponse).toEqual({ id: 'r' })
      expect(snackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should handle missing provider data', () => {
      component.providerDetails = undefined
      component.ssoConfigurationSettings = makeLtiSettings()
      marketplaceService.updateProvider.mockReturnValue(of({ params: { status: 'success' } }))
      component.saveLtiConfiguration()
      expect(marketplaceService.updateProvider.mock.calls[0][0].data.protocol).toBe('LTI')
    })

    it('should show the backend message when the response is not a success', () => {
      component.ssoConfigurationSettings = makeLtiSettings()
      marketplaceService.updateProvider.mockReturnValue(of({ params: { status: 'failed', errMsg: 'bad' } }))
      component.saveLtiConfiguration()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('bad')
    })

    it('should show a default message when the failure has no message', () => {
      component.ssoConfigurationSettings = makeLtiSettings()
      marketplaceService.updateProvider.mockReturnValue(of(null))
      component.saveLtiConfiguration()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Failed to save LTI configuration')
    })

    it('should show the error message on API error', () => {
      component.ssoConfigurationSettings = makeLtiSettings()
      marketplaceService.updateProvider.mockReturnValue(throwError({ error: { params: { errMsg: 'boom' } } }))
      component.saveLtiConfiguration()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('boom')
    })

    it('should show a default message on API error without details', () => {
      component.ssoConfigurationSettings = makeLtiSettings()
      marketplaceService.updateProvider.mockReturnValue(throwError({}))
      component.saveLtiConfiguration()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Something went wrong, please try again later')
    })
  })

  describe('loadSSODetails', () => {
    it('should store the details and emit the provider with them', () => {
      const emitted = jest.fn()
      component.loadProviderDetails.subscribe(emitted)
      const event: any = { ssoId: 's1' }
      component.loadSSODetails(event)
      expect(component.ssoConfigurations).toBe(event)
      expect(emitted).toHaveBeenCalledWith({ ...component.providerDetails, ssoDetails: event })
    })
  })

  describe('isSSOSuccessfullyConfigured', () => {
    it('should be truthy when everything is complete', () => {
      component.providerDetails = { data: { isAuthenticate: true, isActive: true } }
      component.ssoConfigurations = { configuration: 'completed', ssoTested: true } as any
      expect(component.isSSOSuccessfullyConfigured).toBeTruthy()
    })

    it('should be falsy when the test has not passed', () => {
      component.providerDetails = { data: { isAuthenticate: true, isActive: true } }
      component.ssoConfigurations = { configuration: 'completed', ssoTested: false } as any
      expect(component.isSSOSuccessfullyConfigured).toBeFalsy()
    })

    it('should be falsy without details', () => {
      component.providerDetails = undefined
      expect(component.isSSOSuccessfullyConfigured).toBeFalsy()
    })
  })

  describe('enableTestSSOButton', () => {
    it('should be false without settings', () => {
      expect(component.enableTestSSOButton).toBe(false)
    })

    it('should be true for an LTI provider', () => {
      component.ssoConfigurationSettings = makeLtiSettings()
      component.providerDetails = { data: { protocol: 'LTI' } }
      expect(component.enableTestSSOButton).toBe(true)
    })

    it('should be true when there is no SSO test url', () => {
      component.ssoConfigurationSettings = makeSsoSettings()
      component.ssoConfigurations = null
      expect(component.enableTestSSOButton).toBe(true)
    })

    it('should be false when an SSO test url exists', () => {
      component.ssoConfigurationSettings = makeSsoSettings()
      component.ssoConfigurations = { ssoTestUrl: 'https://example.com' } as any
      expect(component.enableTestSSOButton).toBe(false)
    })
  })

  describe('isLtiSelected', () => {
    it('should reflect the settings type', () => {
      expect(component.isLtiSelected).toBe(false)
      component.ssoConfigurationSettings = makeLtiSettings()
      expect(component.isLtiSelected).toBe(true)
      component.ssoConfigurationSettings = makeSsoSettings()
      expect(component.isLtiSelected).toBe(false)
    })
  })

  describe('canSave', () => {
    it('should be false without settings', () => {
      expect(component.canSave).toBe(false)
    })

    it('should use canSaveLti for LTI', () => {
      const settings = makeLtiSettings()
      component.ssoConfigurationSettings = settings
      expect(component.canSave).toBe(true)
      settings.canSaveLti = false
      expect(component.canSave).toBe(false)
    })

    it('should be false for an untouched SSO form', () => {
      component.ssoConfigurationSettings = makeSsoSettings()
      expect(component.canSave).toBe(false)
    })

    it('should be true for a valid, touched SSO form', () => {
      const settings = makeSsoSettings()
      settings.acsUrl.markAsTouched()
      component.ssoConfigurationSettings = settings
      expect(component.canSave).toBe(true)
    })

    it('should be true for a valid, dirty SSO form', () => {
      const settings = makeSsoSettings()
      settings.status.markAsDirty()
      component.ssoConfigurationSettings = settings
      expect(component.canSave).toBe(true)
    })

    it('should be false when save is disabled', () => {
      const settings = makeSsoSettings({ isSaveDisabled: true })
      settings.acsUrl.markAsTouched()
      component.ssoConfigurationSettings = settings
      expect(component.canSave).toBe(false)
    })

    it('should be false when a control is invalid', () => {
      const settings = makeSsoSettings({ acsUrl: new FormControl('', Validators.required) })
      settings.acsUrl.markAsTouched()
      component.ssoConfigurationSettings = settings
      expect(component.canSave).toBe(false)
    })
  })

  describe('testSsoUrl', () => {
    it('should open the loader and run the SSO test for non LTI', () => {
      const ssoSpy = jest.spyOn(component, 'testSSOConfiguration').mockImplementation(() => undefined)
      component.ssoConfigurationSettings = makeSsoSettings()
      component.testSsoUrl()
      expect(dialog.open).toHaveBeenCalled()
      expect(ssoSpy).toHaveBeenCalledWith(dialogRef)
    })

    it('should run the LTI test for LTI', () => {
      const ltiSpy = jest.spyOn(component, 'testLtiConfiguration').mockImplementation(() => undefined)
      component.ssoConfigurationSettings = makeLtiSettings()
      component.testSsoUrl()
      expect(ltiSpy).toHaveBeenCalledWith(dialogRef)
    })
  })

  describe('testSSOConfiguration', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      component.ssoConfigurationSettings = makeSsoSettings({ SSOConfigurationData: { ssoTestUrl: 'u', ssoId: 'sid' } })
    })

    it('should update SSO and provider, then refresh after the delay', () => {
      const emitted = jest.fn()
      component.loadProviderDetails.subscribe(emitted)
      component.testSSOConfiguration(dialogRef)
      expect(marketplaceService.testSSOConfiguration).toHaveBeenCalledWith({ courseDeeplink: 'u', ssoId: 'sid' })
      expect(marketplaceService.updateSSOConfiguration.mock.calls[0][1]).toEqual(expect.objectContaining({ ssoTested: true, configuration: 'completed' }))
      expect(component.ssoConfigurations).toEqual({ ssoId: 's1' })
      jest.advanceTimersByTime(1000)
      expect(dialogRef.close).toHaveBeenCalled()
      expect(component.ssoConfigurationSettings.fetchSSOSettings).toHaveBeenCalled()
      expect(emitted).toHaveBeenCalledWith(true)
    })

    it('should not store SSO data when the response has none', () => {
      marketplaceService.updateSSOConfiguration.mockReturnValue(of({}))
      component.testSSOConfiguration(dialogRef)
      expect(component.ssoConfigurations).toBeNull()
      jest.advanceTimersByTime(1000)
    })

    it('should tolerate missing settings after the delay', () => {
      component.ssoConfigurationSettings = undefined as any
      component.testSSOConfiguration(dialogRef)
      jest.advanceTimersByTime(1000)
      expect(dialogRef.close).toHaveBeenCalled()
    })

    it('should stop and report an error when the SSO test fails', () => {
      marketplaceService.testSSOConfiguration.mockReturnValue(of({ responseCode: 'FAIL', params: { errmsg: 'invalid' } }))
      component.testSSOConfiguration(dialogRef)
      expect(dialogRef.close).toHaveBeenCalled()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.type).toBe('error')
      expect(marketplaceService.updateSSOConfiguration).not.toHaveBeenCalled()
    })

    it('should report an error when the SSO test returns nothing', () => {
      marketplaceService.testSSOConfiguration.mockReturnValue(of(null))
      component.testSSOConfiguration(dialogRef)
      expect(snackBar.openFromComponent.mock.calls[0][1].data.type).toBe('error')
    })

    it('should show a default message on API error', () => {
      marketplaceService.testSSOConfiguration.mockReturnValue(throwError({}))
      component.testSSOConfiguration(dialogRef)
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Something went wrong, please try again later')
    })

    it('should handle missing provider id and settings data', () => {
      component.ssoConfigurationSettings = makeSsoSettings()
      component.providerDetails = { data: {} }
      component.testSSOConfiguration(dialogRef)
      expect(marketplaceService.testSSOConfiguration).toHaveBeenCalledWith({ courseDeeplink: '', ssoId: '' })
    })
  })

  describe('testLtiConfiguration', () => {
    const ltiConfiguration = () => ({
      ltiVersion: '1.3', toolIssuer: 'i', clientId: 'c', deploymentId: 'd', redirectLaunchUrl: 'https://example.com/launch',
    })

    it('should strip legacy fields and record a passed test', () => {
      component.providerDetails = { id: 'p1', data: { partnerCode: 'pc', ltiConfiguration: ltiConfiguration() } }
      component.testLtiConfiguration(dialogRef)
      const payload = marketplaceService.updateProvider.mock.calls[0][0]
      expect(marketplaceService.ltiSSOTest).toHaveBeenCalledWith('pc')
      expect(payload.data.ltiConfiguration).toEqual({
        redirectLaunchUrl: 'https://example.com/launch',
        ssoTestStatus: 'Success',
        message: 'LTI configuration test failed',
      })
      expect(dialogRef.close).toHaveBeenCalled()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.type).toBe('success')
    })

    it('should use the backend error message when provided', () => {
      component.providerDetails = { id: 'p1', data: { partnerCode: 'pc', ltiConfiguration: ltiConfiguration() } }
      marketplaceService.ltiSSOTest.mockReturnValue(of({ responseCode: 'OK', params: { status: 'Failed', errmsg: 'nonce' } }))
      component.testLtiConfiguration(dialogRef)
      expect(marketplaceService.updateProvider.mock.calls[0][0].data.ltiConfiguration.message).toBe('nonce')
    })

    it('should mark the test as failed when the response is not OK', () => {
      component.providerDetails = { id: 'p1', data: { partnerCode: 'pc', ltiConfiguration: ltiConfiguration() } }
      marketplaceService.ltiSSOTest.mockReturnValue(of({ responseCode: 'FAIL' }))
      marketplaceService.updateProvider.mockReturnValue(of({ responseCode: 'FAIL' }))
      component.testLtiConfiguration(dialogRef)
      expect(marketplaceService.updateProvider.mock.calls[0][0].data.ltiConfiguration.ssoTestStatus).toBe('Failed')
      expect(snackBar.openFromComponent.mock.calls[0][1].data.type).toBe('error')
    })

    it('should skip patching when there is no LTI configuration', () => {
      component.providerDetails = { id: 'p1', data: { partnerCode: 'pc' } }
      component.testLtiConfiguration(dialogRef)
      expect(marketplaceService.updateProvider.mock.calls[0][0].data.ltiConfiguration).toBeUndefined()
    })

    it('should handle a missing provider', () => {
      component.providerDetails = undefined
      component.testLtiConfiguration(dialogRef)
      expect(marketplaceService.ltiSSOTest).toHaveBeenCalledWith(undefined)
    })

    it('should show an error message on API error', () => {
      marketplaceService.ltiSSOTest.mockReturnValue(throwError({ error: { params: { errmsg: 'down' } } }))
      component.testLtiConfiguration(dialogRef)
      expect(dialogRef.close).toHaveBeenCalled()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('down')
    })

    it('should show a default message on API error without details', () => {
      marketplaceService.ltiSSOTest.mockReturnValue(throwError({}))
      component.testLtiConfiguration(dialogRef)
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Something went wrong, please try again later')
    })
  })

  describe('showSnackBar', () => {
    it('should open the snackbar with the type as panel class', () => {
      component.showSnackBar('hi', 'success')
      expect(snackBar.openFromComponent).toHaveBeenCalledWith(expect.anything(), {
        data: { message: 'hi', type: 'success' }, duration: 5000, panelClass: 'success',
      })
    })
  })
})
