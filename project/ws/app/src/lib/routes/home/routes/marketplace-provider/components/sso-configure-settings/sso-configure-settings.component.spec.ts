import { FormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { SsoConfigureSettingsComponent } from './sso-configure-settings.component'

describe('SsoConfigureSettingsComponent', () => {
  let component: SsoConfigureSettingsComponent
  let marketplaceService: any
  let snackBar: any

  const validLti = {
    ltiVersion: '1.3',
    toolIssuer: 'issuer',
    clientId: 'client',
    deploymentId: 'dep',
    toolPublicJwksUrl: 'https://example.com/jwks',
    oidcLoginInitiationUrl: 'https://example.com/login',
    redirectLaunchUrl: 'https://example.com/launch',
    deepLinkingUrl: '',
  }

  beforeEach(() => {
    marketplaceService = {
      getSSOConfiguration: jest.fn().mockReturnValue(of({ params: { status: 'success' }, result: {} })),
      createSSOConfiguration: jest.fn(),
      updateSSOConfiguration: jest.fn(),
      updateProvider: jest.fn().mockReturnValue(of({ params: { status: 'success' } })),
    }
    snackBar = { openFromComponent: jest.fn() }
    const route: any = { data: of({ pageData: { data: {} } }) }
    component = new SsoConfigureSettingsComponent(
      { copy: jest.fn() } as any, new FormBuilder(), marketplaceService, snackBar,
      { setLoaderState: jest.fn() } as any, { navigateByUrl: jest.fn() } as any, route)
    component.providerDetails = { id: 'p1', data: { contentPartnerName: 'Partner' } }
    component.ngOnInit()
  })

  it('defaults to SSO integration and offers both options', () => {
    expect(component.settingsType).toBe('sso')
    expect(component.settingsOptions.map(o => o.name)).toEqual(['SSO integration', 'LTI support'])
  })

  it('treats an empty configuration as first visit', () => {
    expect(component.SSOConfigurationData).toBeNull()
    expect(component.settingsType).toBe('sso')
    expect(component.showLtiReadonlyFields).toBe(false)
  })

  it('keeps SSO controls and validation unchanged', () => {
    expect(Object.keys(component.ssoSettingsForm.controls)).toEqual(['clientId', 'partnerName', 'ssoProtocol', 'ssoUrl', 'mappers'])
    component.ssoSettingsForm.get('ssoUrl')!.setValue('bad')
    expect(component.ssoSettingsForm.get('ssoUrl')!.hasError('invalidUrl')).toBe(true)
  })

  it('builds only the four editable LTI controls up front', () => {
    expect(Object.keys(component.ltiForm.controls)).toEqual(['toolPublicJwksUrl', 'oidcLoginInitiationUrl', 'redirectLaunchUrl', 'deepLinkingUrl'])
  })

  it('requires the three mandatory LTI fields only', () => {
    const required = Object.keys(component.ltiForm.controls).filter(k => component.ltiForm.get(k)!.hasError('required'))
    expect(required).toEqual(['toolPublicJwksUrl', 'oidcLoginInitiationUrl', 'redirectLaunchUrl'])
    expect(component.ltiForm.get('deepLinkingUrl')!.valid).toBe(true)
  })

  it('validates LTI URLs with the SSO URL rules, including optional deep linking URL', () => {
    ['toolPublicJwksUrl', 'oidcLoginInitiationUrl', 'redirectLaunchUrl', 'deepLinkingUrl'].forEach(k => {
      component.ltiForm.get(k)!.setValue('not a url')
      expect(component.ltiForm.get(k)!.hasError('invalidUrl')).toBe(true)
    })
    component.ltiForm.patchValue(validLti)
    expect(component.ltiForm.valid).toBe(true)
  })

  it('warns only when the current form has unsaved changes', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    component.onSettingsChange('LTI')
    expect(warn).not.toHaveBeenCalled()
    component.ltiForm.get('deepLinkingUrl')!.setValue('https://example.com/x')
    component.ltiForm.markAsDirty()
    component.onSettingsChange('sso')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('patches LTI config from provider protocol, locks identity fields and does not warn', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    component.providerDetails = { id: 'p1', data: { contentPartnerName: 'P', protocol: 'LTI', ltiConfiguration: { ...validLti, deepLinkingUrl: undefined } } }
    component.fetchSSOSettings()
    expect(component.settingsType).toBe('LTI')
    expect(component.showLtiReadonlyFields).toBe(true)
    expect(component.ltiForm.get('toolIssuer')!.value).toBe('issuer')
    expect(component.ltiForm.get('deepLinkingUrl')!.value).toBe('')
      ;['ltiVersion', 'toolIssuer', 'clientId', 'deploymentId'].forEach(k => expect(component.ltiForm.get(k)!.disabled).toBe(true))
    expect(component.ltiForm.get('toolPublicJwksUrl')!.enabled).toBe(true)
    component.onSettingsChange('sso')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('stays on SSO with an editable LTI form when protocol is not LTI', () => {
    component.providerDetails = { id: 'p1', data: { protocol: 'SSO' } }
    component.fetchSSOSettings()
    expect(component.settingsType).toBe('sso')
    expect(component.showLtiReadonlyFields).toBe(false)
    expect(component.ltiForm.get('toolIssuer')).toBeNull()
  })

  it('keeps the two forms independent when switching', () => {
    component.ssoSettingsForm.get('clientId')!.setValue('sso-client')
    component.onSettingsChange('LTI')
    expect(component.ltiForm.get('clientId')).toBeNull()
  })

  it('locks the protocol and skips the SSO API for a saved LTI provider', () => {
    marketplaceService.getSSOConfiguration.mockClear()
    component.providerDetails = { id: 'p1', data: { protocol: 'LTI', ltiConfiguration: validLti } }
    component.fetchSSOSettings()
    expect(component.isProtocolLocked).toBe(true)
    expect(component.isSavedConfiguration).toBe(true)
    expect(marketplaceService.getSSOConfiguration).not.toHaveBeenCalled()
  })

  it('does not lock the protocol for a first-time provider and hides the identity fields until saved', () => {
    component.providerDetails = { id: 'p1', data: { ltiConfiguration: { ltiVersion: '1.3', toolIssuer: 'iss', clientId: 'c', deploymentId: 'd' } } }
    component.fetchSSOSettings()
    expect(component.isProtocolLocked).toBe(false)
    component.onSettingsChange('LTI')
    expect(component.showLtiReadonlyFields).toBe(false)
    expect(component.ltiForm.get('toolIssuer')).toBeNull()
    expect(component.isSavedConfiguration).toBe(false)
  })

  it('locks the protocol for a non-LTI provider once an SSO configuration is saved', () => {
    marketplaceService.getSSOConfiguration.mockReturnValue(of({
      params: { status: 'success' },
      result: { ssoData: { clientId: 'c1', ssoUrl: 'https://example.com/sso', ssoProtocol: 'saml', mappers: [] } },
    }))
    component.providerDetails = { id: 'p1', data: { protocol: 'SSO' } }
    component.fetchSSOSettings()
    expect(component.isProtocolLocked).toBe(true)
    expect(component.settingsType).toBe('sso')
    expect(marketplaceService.getSSOConfiguration).toHaveBeenCalled()
  })

  it('does not lock the protocol for a non-LTI provider without a saved SSO configuration', () => {
    component.providerDetails = { id: 'p1', data: { protocol: 'SSO' } }
    component.fetchSSOSettings()
    expect(component.isProtocolLocked).toBe(false)
    expect(component.settingsType).toBe('sso')
  })

  it('patches the SSO form from a saved SSO configuration', () => {
    marketplaceService.getSSOConfiguration.mockReturnValue(of({
      params: { status: 'success' },
      result: { ssoData: { clientId: 'c1', ssoUrl: 'https://example.com/sso', ssoProtocol: 'saml', mappers: [] } },
    }))
    component.fetchSSOSettings()
    expect(component.settingsType).toBe('sso')
    expect(component.ssoSettingsForm.get('clientId')!.value).toBe('c1')
  })

  it('handles a read API failure without changing the selection', () => {
    marketplaceService.getSSOConfiguration.mockReturnValue(throwError(() => new Error('fail')))
    component.fetchSSOSettings()
    expect(component.settingsType).toBe('sso')
  })

  describe('extractErrorMessage', () => {
    it('should return a default message when error is empty', () => {
      expect(component.extractErrorMessage(null)).toBe('Something went wrong')
    })

    it('should return errorMessage from an error object', () => {
      expect(component.extractErrorMessage({ errorMessage: 'Invalid entity id' })).toBe('Invalid entity id')
    })

    it('should extract errorMessage from JSON embedded in a string', () => {
      const error = 'Request failed: {"errorMessage":"Invalid certificate"}'
      expect(component.extractErrorMessage(error)).toBe('Invalid certificate')
    })

    it('should extract errorMessage from JSON spanning multiple lines', () => {
      const error = 'Request failed: {\n  "errorMessage": "Invalid certificate"\n}'
      expect(component.extractErrorMessage(error)).toBe('Invalid certificate')
    })

    it('should return the original string when the JSON has no errorMessage', () => {
      const error = 'Request failed: {"code":400}'
      expect(component.extractErrorMessage(error)).toBe(error)
    })

    it('should return the original string when the embedded JSON is invalid', () => {
      const error = 'Request failed: {not json}'
      expect(component.extractErrorMessage(error)).toBe(error)
    })

    it('should return a default message for a string without JSON', () => {
      expect(component.extractErrorMessage('plain error')).toBe('Something went wrong')
      expect(component.extractErrorMessage('} before {')).toBe('Something went wrong')
    })

    it('should handle a long string of unmatched braces quickly', () => {
      const start = Date.now()
      expect(component.extractErrorMessage('{'.repeat(50000))).toBe('Something went wrong')
      expect(Date.now() - start).toBeLessThan(1000)
    })
  })
})

describe('SsoConfigureSettingsComponent - behaviour', () => {
  let component: SsoConfigureSettingsComponent
  let marketplaceService: any
  let snackBar: any
  let clipboard: any
  let loader: any
  let router: any

  const ssoData: any = {
    ssoId: 'sid',
    clientId: 'c1',
    ssoUrl: 'https://example.com/sso',
    ssoProtocol: 'saml',
    acsUrl: 'https://example.com/acs',
    ssoTestUrl: 'https://example.com/test',
    status: true,
    configuration: 'completed',
    ssoTested: true,
    mappers: { email: 'mail' },
  }

  beforeEach(() => {
    jest.useFakeTimers()
    marketplaceService = {
      getSSOConfiguration: jest.fn().mockReturnValue(of({ params: { status: 'success' }, result: {} })),
      createSSOConfiguration: jest.fn().mockReturnValue(of({ params: { status: 'success' } })),
      updateSSOConfiguration: jest.fn().mockReturnValue(of({ params: { status: 'success' } })),
    }
    snackBar = { openFromComponent: jest.fn() }
    clipboard = { copy: jest.fn() }
    loader = { setLoaderState: jest.fn() }
    router = { navigateByUrl: jest.fn() }
    const route: any = { data: of({ pageData: { data: { SSO_attributs: ['a', 'b'] } } }) }
    component = new SsoConfigureSettingsComponent(clipboard, new FormBuilder(), marketplaceService, snackBar, loader, router, route)
    component.providerDetails = { id: 'p1', data: { contentPartnerName: 'Partner' } }
    component.ngOnInit()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const fillValidSso = () => {
    component.ssoSettingsForm.patchValue({ clientId: 'c1', ssoUrl: 'https://example.com/sso' })
    component.acsUrl.setValue('https://example.com/acs')
    component.ssoTestUrl.setValue('https://example.com/test')
    component.mappersFormArray.at(0).patchValue({ key: 'k', value: 'v' })
  }

  it('loads attribute options from the route data', () => {
    expect(component.attributesOptionsList).toEqual(['a', 'b'] as any)
  })

  it('skips attribute options when route data has none', () => {
    const route: any = { data: of({ pageData: {} }) }
    const other = new SsoConfigureSettingsComponent(clipboard, new FormBuilder(), marketplaceService, snackBar, loader, router, route)
    other.initializeForm()
    expect(other.attributesOptionsList).toEqual([])
  })

  it('exposes the active form for the selected type', () => {
    expect(component.activeForm).toBe(component.ssoSettingsForm)
    component.onSettingsChange('LTI')
    expect(component.activeForm).toBe(component.ltiForm)
  })

  it('ignores selecting the already active type', () => {
    component.onSettingsChange('sso')
    expect(component.settingsType).toBe('sso')
  })

  it('reports saved protocol and saved configuration for sso', () => {
    expect(component.savedProtocol).toBe('')
    expect(component.isSavedConfiguration).toBe(false)
    component.SSOConfigurationData = ssoData
    expect(component.isSavedConfiguration).toBe(true)
  })

  it('updates the LTI readonly control when it already exists', () => {
    component.providerDetails = { id: 'p1', data: { protocol: 'LTI' } }
    component.patchLtiForm({ toolIssuer: 'one' })
    component.patchLtiForm({ toolIssuer: 'two' })
    expect(component.ltiForm.get('toolIssuer')!.value).toBe('two')
  })

  it('patches with empty values when config is empty', () => {
    component.patchLtiForm({})
    expect(component.ltiForm.get('toolPublicJwksUrl')!.value).toBe('')
    expect(component.showLtiReadonlyFields).toBe(false)
  })

  it('exposes canSaveLti from the form dirty state', () => {
    expect(component.canSaveLti).toBe(false)
    component.ltiForm.markAsDirty()
    expect(component.canSaveLti).toBe(true)
  })

  it('does not repatch a dirty LTI form', () => {
    component.providerDetails = { id: 'p1', data: { protocol: 'lti', ltiConfiguration: { toolPublicJwksUrl: 'https://example.com/new' } } }
    component.ltiForm.markAsDirty()
    expect(component.applyProviderProtocol()).toBe(true)
    expect(component.ltiForm.get('toolPublicJwksUrl')!.value).toBe('')
  })

  it('patches an LTI form with no configuration', () => {
    component.providerDetails = { id: 'p1', data: { protocol: 'LTI' } }
    expect(component.applyProviderProtocol()).toBe(true)
    expect(component.settingsType).toBe('LTI')
  })

  describe('ngOnChanges', () => {
    it('applies the protocol on later changes', () => {
      component.providerDetails = { id: 'p1', data: { protocol: 'LTI', ltiConfiguration: {} } }
      component.ngOnChanges({ providerDetails: { firstChange: false } as any })
      expect(component.settingsType).toBe('LTI')
    })

    it('ignores the first change and unrelated changes', () => {
      component.providerDetails = { id: 'p1', data: { protocol: 'LTI' } }
      component.ngOnChanges({ providerDetails: { firstChange: true } as any })
      component.ngOnChanges({})
      expect(component.settingsType).toBe('sso')
    })
  })

  describe('mappers', () => {
    it('starts with one empty mapper and blocks adding another', () => {
      expect(component.mappersFormArray.length).toBe(1)
      expect(component.canAddMapper()).toBeFalsy()
      component.addMappers()
      expect(component.mappersFormArray.length).toBe(1)
    })

    it('adds a mapper when the last one is filled', () => {
      component.mappersFormArray.at(0).patchValue({ key: 'k', value: 'v' })
      component.addMappers()
      expect(component.mappersFormArray.length).toBe(2)
      expect(component.ssoSettingsForm.dirty).toBe(true)
    })

    it('treats an empty list as filled', () => {
      component.mappersFormArray.clear()
      expect(component.isLastMapperFilled()).toBe(true)
    })

    it('removes a mapper and marks the form dirty', () => {
      component.removeMapper(0)
      expect(component.mappersFormArray.length).toBe(0)
      expect(component.ssoSettingsForm.dirty).toBe(true)
    })

    it('adds an empty mapper only when none exist', () => {
      component.addEmptyMapperIfNone()
      expect(component.mappersFormArray.length).toBe(1)
      component.mappersFormArray.clear()
      component.addEmptyMapperIfNone()
      expect(component.mappersFormArray.length).toBe(1)
    })

    it('populates from an array', () => {
      component.populateMappers([{ key: 'a', value: '1' }, { key: 'b', value: '2' }])
      expect(component.getMappersValue()).toEqual({ a: '1', b: '2' })
    })

    it('populates from an object', () => {
      component.populateMappers({ a: '1' })
      expect(component.getMappersValue()).toEqual({ a: '1' })
    })

    it('adds an empty mapper for empty or missing input', () => {
      component.populateMappers([])
      expect(component.mappersFormArray.length).toBe(1)
      component.populateMappers(null as any)
      expect(component.mappersFormArray.length).toBe(1)
    })

    it('skips incomplete mappers in the value', () => {
      component.mappersFormArray.at(0).patchValue({ key: 'only-key', value: '' })
      expect(component.getMappersValue()).toEqual({})
    })
  })

  describe('isSaveDisabled', () => {
    it('follows the LTI form when LTI is selected', () => {
      component.onSettingsChange('LTI')
      expect(component.isSaveDisabled).toBe(true)
      component.ltiForm.markAsDirty()
      expect(component.isSaveDisabled).toBe(false)
    })

    it('compares SSO values with the initial values', () => {
      component.initialFormValue = component.ssoSettingsForm.getRawValue()
      expect(component.isSaveDisabled).toBe(true)
      component.status.setValue(true)
      expect(component.isSaveDisabled).toBe(false)
    })
  })

  describe('copy', () => {
    it('flags the callback url as copied then resets', () => {
      component.copy('callback', 'x')
      expect(clipboard.copy).toHaveBeenCalledWith('x')
      expect(component.callbackUrlCopied).toBe(true)
      jest.advanceTimersByTime(1000)
      expect(component.callbackUrlCopied).toBe(false)
    })

    it('flags the redirect url as copied then resets', () => {
      component.copy('redirect', 'y')
      expect(component.redirectUrlCopied).toBe(true)
      jest.advanceTimersByTime(1000)
      expect(component.redirectUrlCopied).toBe(false)
    })

    it('ignores unknown types', () => {
      component.copy('other', 'z')
      expect(component.callbackUrlCopied).toBe(false)
      expect(component.redirectUrlCopied).toBe(false)
    })
  })

  describe('fetchSSOSettings', () => {
    it('does nothing without a provider id', () => {
      marketplaceService.getSSOConfiguration.mockClear()
      component.providerDetails = undefined
      component.fetchSSOSettings()
      expect(marketplaceService.getSSOConfiguration).not.toHaveBeenCalled()
    })

    it('loads saved data and emits it', () => {
      const emitted = jest.fn()
      component.loadSSODetails.subscribe(emitted)
      marketplaceService.getSSOConfiguration.mockReturnValue(of({ params: { status: 'success' }, result: { ssoData } }))
      component.fetchSSOSettings()
      expect(emitted).toHaveBeenCalledWith(ssoData)
      expect(component.status.value).toBe(true)
      expect(component.acsUrl.value).toBe('https://example.com/acs')
      expect(component.initialSsoTestUrl).toBe('https://example.com/test')
      expect(component.initialStatus).toBe(true)
      expect(component.getMappersValue()).toEqual({ email: 'mail' })
    })

    it('falls back to defaults for sparse saved data', () => {
      marketplaceService.getSSOConfiguration.mockReturnValue(of({ params: { status: 'success' }, result: { ssoData: { ssoId: 'x' } } }))
      component.providerDetails = { id: 'p1' }
      component.fetchSSOSettings()
      expect(component.initialAcsUrl).toBe('')
      expect(component.initialFormValue.ssoProtocol).toBe('saml')
      expect(component.initialStatus).toBe(false)
    })

    it('ignores an unsuccessful response', () => {
      marketplaceService.getSSOConfiguration.mockReturnValue(of(null))
      component.fetchSSOSettings()
      expect(component.SSOConfigurationData).toBeNull()
      expect(loader.setLoaderState).toHaveBeenLastCalledWith(false)
    })
  })

  describe('createSSOConfigurations', () => {
    it('marks everything touched and skips the API when invalid', () => {
      component.createSSOConfigurations()
      expect(component.acsUrl.touched).toBe(true)
      expect(marketplaceService.createSSOConfiguration).not.toHaveBeenCalled()
    })

    it('creates and refreshes on success', () => {
      fillValidSso()
      component.createSSOConfigurations()
      expect(marketplaceService.createSSOConfiguration.mock.calls[0][1]).toEqual(expect.objectContaining({
        mappers: { k: 'v' }, acsUrl: 'https://example.com/acs',
      }))
      expect(snackBar.openFromComponent.mock.calls[0][1].data.type).toBe('success')
    })

    it('shows the backend message on a failed create', () => {
      fillValidSso()
      marketplaceService.createSSOConfiguration.mockReturnValue(of({ params: { status: 'failed', errmsg: 'nope' } }))
      component.createSSOConfigurations()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('nope')
    })

    it('shows a default message when a failed create has no message', () => {
      fillValidSso()
      marketplaceService.createSSOConfiguration.mockReturnValue(of(null))
      component.createSSOConfigurations()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Failed to create SSO Configuration')
    })

    it('shows the extracted error on API error', () => {
      fillValidSso()
      marketplaceService.createSSOConfiguration.mockReturnValue(throwError({ error: { message: { errorMessage: 'bad cert' } } }))
      component.createSSOConfigurations()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('bad cert')
      expect(loader.setLoaderState).toHaveBeenLastCalledWith(false)
    })
  })

  describe('updateSSOConfigurations', () => {
    beforeEach(() => {
      fillValidSso()
      component.SSOConfigurationData = ssoData
    })

    it('marks touched and skips the API when invalid', () => {
      component.ssoSettingsForm.get('clientId')!.setValue('')
      component.updateSSOConfigurations()
      expect(marketplaceService.updateSSOConfiguration).not.toHaveBeenCalled()
      expect(component.ssoSettingsForm.touched).toBe(true)
    })

    it('marks the configuration incomplete when a control changed', () => {
      component.acsUrl.markAsDirty()
      component.updateSSOConfigurations()
      const payload = marketplaceService.updateSSOConfiguration.mock.calls[0][1]
      expect(payload.configuration).toBe('incomplete')
      expect(payload.ssoTested).toBe(false)
      expect(snackBar.openFromComponent.mock.calls[0][1].data.type).toBe('success')
      expect(component.acsUrl.dirty).toBe(false)
    })

    it('keeps the saved configuration when nothing changed', () => {
      component.updateSSOConfigurations()
      const payload = marketplaceService.updateSSOConfiguration.mock.calls[0][1]
      expect(payload.configuration).toBe('completed')
      expect(payload.ssoTested).toBe(true)
      expect(payload.validRedirectUrls).toEqual([])
    })

    it('omits ssoTested and ssoId when not available', () => {
      component.SSOConfigurationData = null
      component.updateSSOConfigurations()
      const payload = marketplaceService.updateSSOConfiguration.mock.calls[0][1]
      expect(payload.ssoTested).toBeUndefined()
      expect(payload.ssoId).toBe('')
    })

    it('shows the backend message on a failed update', () => {
      marketplaceService.updateSSOConfiguration.mockReturnValue(of({ params: { status: 'failed', errmsg: 'nope' } }))
      component.updateSSOConfigurations()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('nope')
    })

    it('shows a default message when a failed update has no message', () => {
      marketplaceService.updateSSOConfiguration.mockReturnValue(of(null))
      component.updateSSOConfigurations()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Failed to update SSO Configuration')
    })

    it('shows the extracted error on API error', () => {
      marketplaceService.updateSSOConfiguration.mockReturnValue(throwError({}))
      component.updateSSOConfigurations()
      expect(snackBar.openFromComponent.mock.calls[0][1].data.message).toBe('Something went wrong')
    })
  })

  describe('updateCreateSSO', () => {
    it('updates when saved data exists', () => {
      const spy = jest.spyOn(component, 'updateSSOConfigurations').mockImplementation(() => undefined)
      component.SSOConfigurationData = ssoData
      component.updateCreateSSO()
      expect(spy).toHaveBeenCalled()
    })

    it('creates when there is no saved data', () => {
      const spy = jest.spyOn(component, 'createSSOConfigurations').mockImplementation(() => undefined)
      component.updateCreateSSO()
      expect(spy).toHaveBeenCalled()
    })
  })

  it('shows a snackbar with the type as panel class', () => {
    component.showSnackBar('m', 'error')
    expect(snackBar.openFromComponent).toHaveBeenCalledWith(expect.anything(), { data: { message: 'm', type: 'error' }, duration: 5000, panelClass: 'error' })
  })

  it('navigates to the providers dashboard', () => {
    component.navigateToProvidersDashboard()
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/marketplace-providers')
  })

  describe('urlValidator', () => {
    const validate = (value: any) => component.urlValidator()({ value } as any)

    it('accepts empty and valid urls', () => {
      expect(validate('')).toBeNull()
      expect(validate('https://example.com')).toBeNull()
    })

    it('rejects malformed urls and bad hosts', () => {
      expect(validate('nope')).toEqual({ invalidUrl: true })
      expect(validate('https://localhost')).toEqual({ invalidUrl: true })
      expect(validate('https://example.c')).toEqual({ invalidUrl: true })
    })
  })
})
