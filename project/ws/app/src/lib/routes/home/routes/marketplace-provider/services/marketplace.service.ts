import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { environment } from '../../../../../../../../../../src/environments/environment'

const API_END_POINTS = {
  CREATE_CONTENTPARTNER: `/apis/proxies/v8/contentpartner/v2/create`,
  UPDATE_CONTENTPARTNER: `/apis/proxies/v8/contentpartner/v2/update`,
  UPLOAD_THUMBNAIL: `apis/proxies/v8/storage/v1/uploadCiosIcon`,
  UPLOAD_CIOS_CONTRACT: `/apis/proxies/v8/storage/v1/uploadCiosContract`,
  GET_PROVIDERS_LIST: `/apis/proxies/v8/contentpartner/v1/search`,
  DELETE_PROVIDER: `/apis/proxies/v8/contentpartner/v1/delete/`,
  ACTIVATE_PROVIDER: `/apis/proxies/v8/contentpartner/v1/activate`,
  GET_PROVIDER_DETAILS: (id: string) => `/apis/proxies/v8/contentpartner/v1/read/${id}`,
  UPLOAD_CONTENT: `/apis/proxies/v8/ciosIntegration/v1/loadContentFromExcel/`,
  UPLOAD_PROGRES: `/apis/proxies/v8/ciosIntegration/v1/loadContentProgressFromExcel/`,
  GET_FILES_LIST: `/apis/proxies/v8/ciosIntegration/v1/file/info/`,
  // GET_CONTENT_LIST: `/apis/proxies/v8/ciosIntegration/v1/readAllContentFromDb`,
  GET_CONTENT_LIST: `apis/proxies/v8/ciosIntegration/v1/search/content`,
  DELETE_NOT_PULISHED_COURSES: 'apis/proxies/v8/ciosIntegration/v1/deleteContent',
  DOWNLOAD_LOG: (gcpfileName: string) => `/apis/proxies/v8/storage/v1/downloadCiosLogs/${gcpfileName}`,
  CREATE_CONFIGURATION: `apis/proxies/v8/serviceregistry/config/create`,
  UPDATE_CONFIGURATION: `apis/proxies/v8/serviceregistry/config/update`,
  GET_CONFIGURATION: (configurationId: string) => `apis/proxies/v8/serviceregistry/config/read/${configurationId}`,

  GET_GROUPS_LIST: `/apis/proxies/v8/user/v1/groups`,

  GET_SSO_CONFIGURATION: (partnerId: string) => `/apis/proxies/v8/sso/read/${partnerId}`,
  CREATE_SSO_CONFIGURATION: (partnerId: string) => `/apis/proxies/v8/sso/create/${partnerId}`,
  UPDATE_SSO_CONFIGURATION: (partnerId: string) => `/apis/proxies/v8/sso/update/${partnerId}`,
  TEST_SSO_CONFIGURATION: `/apis/proxies/v8/sso/validateSaml`,
  LTI_SSO_TEST: (partnerCode: string) => `/apis/proxies/v8/ciosIntegration/lti/ssotest/${partnerCode}`,


  contentRegisterSearch: `/apis/proxies/v8/contentpartner/register/v1/search`,
  updateStatusRegisterProvider: `/apis/proxies/v8/contentpartner/register/v1/update`,
  REGISTERED_PROVIDER_READ: (id: string) => `/apis/proxies/v8/contentpartner/register/v1/readbyid?id=${id}`,
}

@Injectable({
  providedIn: 'root',
})
export class MarketplaceService {
  currentMenuItem: BehaviorSubject<any> = new BehaviorSubject<number>(0);
  newProviderAdded: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient,
  ) { }

  createProvider(formBody: any) {
    return this.http.post(`${API_END_POINTS.CREATE_CONTENTPARTNER}`, formBody)
  }

  updateProvider(formBody: any) {
    return this.http.post(`${API_END_POINTS.UPDATE_CONTENTPARTNER}`, formBody)
  }

  uploadThumbNail(
    icon: any
  ): Observable<any> {
    const file = icon.get('content') as File
    const fileName = file.name
    const newFormData = new FormData()
    newFormData.append('file', file, fileName)
    const url = `${API_END_POINTS.UPLOAD_THUMBNAIL}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  uploadCIOSContract(
    data: any
  ): Observable<any> {
    const file = data.get('content') as File
    const fileName = file.name
    const newFormData = new FormData()
    newFormData.append('file', file, fileName)
    const url = `${API_END_POINTS.UPLOAD_CIOS_CONTRACT}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  getProvidersList(formBody: any) {
    return this.http.post(`${API_END_POINTS.GET_PROVIDERS_LIST}`, formBody)
  }

  deleteProvider(providerId: string) {
    return this.http.delete(`${API_END_POINTS.DELETE_PROVIDER}${providerId}`)
  }

  activateProvider(formBody: any) {
    return this.http.put(`${API_END_POINTS.ACTIVATE_PROVIDER}`, formBody)
  }

  getProviderDetails(id: string) {
    return this.http.get(API_END_POINTS.GET_PROVIDER_DETAILS(id))
  }

  getGroupsList() {
    return this.http.get(`${API_END_POINTS.GET_GROUPS_LIST}`)
  }

  getContentList(providerId: any) {
    return this.http.get(`${API_END_POINTS.GET_FILES_LIST}${providerId}`)
  }

  uploadContent(
    data: any,
    partnerCode: string,
    partnerId: string
  ): Observable<any> {
    const file = data.get('content') as File
    const fileName = file.name
    const newFormData = new FormData()
    newFormData.append('file', file, fileName)
    const url = `${API_END_POINTS.UPLOAD_CONTENT}${partnerCode}/${partnerId}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  uploadProgress(
    data: any,
    partnerCode: string
  ): Observable<any> {
    const file = data.get('content') as File
    const newFormData = new FormData()
    newFormData.append('file', file)
    const url = `${API_END_POINTS.UPLOAD_PROGRES}${partnerCode}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  convertResourceUrl(url?: string): string {
    if (!url) return ''
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return url
    }

    const firstSlash = parsed.pathname.indexOf('/', 1)
    if (firstSlash === -1) return url

    const resourcePath = parsed.pathname.slice(firstSlash)
    return `${environment.contentHost}/content-store${resourcePath}`
  }

  getCoursesList(formBody: any) {
    return this.http.post<any>(`${API_END_POINTS.GET_CONTENT_LIST}`, formBody)
  }

  // deleteCourse(courseId: string) {
  //   return this.http.delete(`${API_END_POINTS.DELETE_COURSE}${courseId}`)
  // }

  deleteUnPublishedCourses(formBody: any) {
    return this.http.post<any>(`${API_END_POINTS.DELETE_NOT_PULISHED_COURSES}`, formBody, { responseType: 'text' as 'json' })
  }

  downloadLogs(gcpfileName: string) {
    return this.http.get<any>(API_END_POINTS.DOWNLOAD_LOG(gcpfileName), { responseType: 'blob' as 'json' })
  }

  //#region (via api)
  createConfiguration(formBody: any) {
    return this.http.post(`${API_END_POINTS.CREATE_CONFIGURATION}`, formBody)
  }

  updateConfiguration(formBody: any) {
    return this.http.post(`${API_END_POINTS.UPDATE_CONFIGURATION}`, formBody)
  }

  getConfiguraionDetails(configurationId: string) {
    return this.http.get(`${API_END_POINTS.GET_CONFIGURATION(configurationId)}`)
  }
  //#endregion

  getSSOConfiguration(partnerId: string): Observable<any> {
    return this.http.get(`${API_END_POINTS.GET_SSO_CONFIGURATION(partnerId)}`)
  }

  createSSOConfiguration(partnerId: string, formBody: any) {
    return this.http.post(`${API_END_POINTS.CREATE_SSO_CONFIGURATION(partnerId)}`, formBody)
  }

  updateSSOConfiguration(partnerId: string, formBody: any) {
    return this.http.post(`${API_END_POINTS.UPDATE_SSO_CONFIGURATION(partnerId)}`, formBody)
  }

  testSSOConfiguration(formBody: any) {
    return this.http.post(`${API_END_POINTS.TEST_SSO_CONFIGURATION}`, formBody)
  }

  ltiSSOTest(partnerCode: string) {
    return this.http.get(`${API_END_POINTS.LTI_SSO_TEST(partnerCode)}`)
  }

  contentRegisterList(formBody: any) {
    return this.http.post(`${API_END_POINTS.contentRegisterSearch}`, formBody)
  }

  changeStatusRegisterProvider(formBody: any) {
    return this.http.post(`${API_END_POINTS.updateStatusRegisterProvider}`, formBody)
  }

  downloadAssetFile(assetPath: string, fileName?: string): void {
    const link = document.createElement('a')
    link.href = assetPath
    link.download = fileName || assetPath.split('/').pop() || 'file'
    link.target = '_blank'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  readRegisteredProviderDetails(id: string) {
    return this.http.get(`${API_END_POINTS.REGISTERED_PROVIDER_READ(id)}`)
  }
}
