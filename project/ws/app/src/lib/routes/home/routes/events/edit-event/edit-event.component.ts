import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { EventsService } from '../services/events.service'
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core'
import { MatPaginator } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatSort } from '@angular/material/sort'
import { ITableData } from '../interfaces/interfaces'
import { MatDialog } from '@angular/material/dialog'
import { ParticipantsComponent } from '../participants/participants.component'
import { SuccessComponent } from '../success/success.component'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import moment from 'moment'
/* tslint:disable */
import * as _ from 'lodash'
import { TelemetryEvents } from '../model/telemetry.event.model'
import { ProfileV2UtillService } from '../services/home-utill.service'
import { MomentDateAdapter } from '@angular/material-moment-adapter'
import { preventHtmlAndJs } from '../../../validators/prevent-html-and-js.validator'
import { ConfirmationPopupComponent } from '../../request/confirmation-popup/confirmation-popup.component'
/* tslint:enable */

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
}
@Component({
  selector: 'ws-app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  standalone: false
})
export class EditEventComponent implements OnInit, OnDestroy {

  artifactURL: any
  participantsArr: any = []
  presentersArr: any = []
  displayedColumns: string[] = ['fullname', 'email', 'type', 'mdoName']
  @Input() tableData!: ITableData | undefined
  @Input() data?: []
  @Input() isUpload?: boolean
  @Input() isCreate?: boolean

  @Output() clicked?: EventEmitter<any>
  @Output() actionsClick?: EventEmitter<any>
  @Output() eOnRowClick = new EventEmitter<any>()
  @Output() eOnCreateClick = new EventEmitter<any>()

  createEventForm: UntypedFormGroup
  namePatern = `^[a-zA-Z\\s\\']{1,32}$`
  department: any = {}
  departmentName = ''
  toastSuccess: any
  pictureObj: any
  myreg = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)[A-Za-z0-9_\-]+/
  eventTitleRegex = new RegExp(
    /^[\u0900-\u097F\u0980-\u09FF\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F\u0A80-\u0AFF\u0B00-\u0B7F\u0A00-\u0A7Fa-zA-Z0-9\(\)\$\[\]\.\-,:!'\" _\/]*$/ // NOSONAR
  )
  // myreg = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi
  // myreg = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/

  // eventTypes = [
  //   { title: 'Webinar', desc: 'General discussion involving', border: 'rgb(0, 116, 182)', disabled: false },
  // ]
  evntTypesList = ['Webinar', 'Karmayogi Talks', 'Karmayogi Saptah', 'Rajya Karmayogi Saptah', 'Sadhana Saptah', 'Samuhik Charcha - NLW 2026']
  stateList = []
  timeArr = [
    { value: '00:00' }, { value: '00:15' }, { value: '00:30' }, { value: '00:45' },
    { value: '01:00' }, { value: '01:15' }, { value: '01:30' }, { value: '01:45' },
    { value: '02:00' }, { value: '02:15' }, { value: '02:30' }, { value: '02:45' },
    { value: '03:00' }, { value: '03:15' }, { value: '03:30' }, { value: '03:45' },
    { value: '04:00' }, { value: '04:15' }, { value: '04:30' }, { value: '04:45' },
    { value: '05:00' }, { value: '05:15' }, { value: '05:30' }, { value: '05:45' },
    { value: '06:00' }, { value: '06:15' }, { value: '06:30' }, { value: '06:45' },
    { value: '07:00' }, { value: '07:15' }, { value: '07:30' }, { value: '07:45' },
    { value: '08:00' }, { value: '08:15' }, { value: '08:30' }, { value: '08:45' },
    { value: '09:00' }, { value: '09:15' }, { value: '09:30' }, { value: '09:45' },
    { value: '10:00' }, { value: '10:15' }, { value: '10:30' }, { value: '10:45' },
    { value: '11:00' }, { value: '11:15' }, { value: '11:30' }, { value: '11:45' },
    { value: '12:00' }, { value: '12:15' }, { value: '12:30' }, { value: '12:45' },
    { value: '13:00' }, { value: '13:15' }, { value: '13:30' }, { value: '13:45' },
    { value: '14:00' }, { value: '14:15' }, { value: '14:30' }, { value: '14:45' },
    { value: '15:00' }, { value: '15:15' }, { value: '15:30' }, { value: '15:45' },
    { value: '16:00' }, { value: '16:15' }, { value: '16:30' }, { value: '16:45' },
    { value: '17:00' }, { value: '17:15' }, { value: '17:30' }, { value: '17:45' },
    { value: '18:00' }, { value: '18:15' }, { value: '18:30' }, { value: '18:45' },
    { value: '19:00' }, { value: '19:15' }, { value: '19:30' }, { value: '19:45' },
    { value: '20:00' }, { value: '20:15' }, { value: '20:30' }, { value: '20:45' },
    { value: '21:00' }, { value: '21:15' }, { value: '21:30' }, { value: '21:45' },
    { value: '22:00' }, { value: '22:15' }, { value: '22:30' }, { value: '22:45' },
    { value: '23:00' }, { value: '23:15' }, { value: '23:30' }, { value: '23:45' },
  ]

  hoursList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  minsList = [0, 15, 30, 45, 59]

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator
  @ViewChild(MatSort, { static: true }) sort?: MatSort

  errorMessages = ''
  dataSource!: any
  widgetData: any
  length!: number
  pageSize = 5
  pageSizeOptions = [5, 10, 20]
  dialogRef: any
  activeUsers: any
  imageSrc: any
  imageSrcURL: any
  currentTab = 'eventInfo'
  userId: any
  username: any
  minDate: any
  maxDate: any
  todayDate: any
  todayTime: any
  hours: any
  minutes: any
  eventimageURL: any
  departmentID: any
  eventBufferTime = 30
  orgtimeArr!: {
    value: string
  }[]
  newtimearray: any = []
  disableCreateButton = false
  displayLoader = false
  eventId: any
  eventObject: any
  reqPayload: any
  showRajyaField = false
  fullEdit: boolean = false
  filter = 'upcoming'
  constructor(private snackBar: MatSnackBar, private eventsSvc: EventsService, private matDialog: MatDialog,
    // tslint:disable-next-line:align
    private router: Router, private configSvc: ConfigurationsService, private changeDetectorRefs: ChangeDetectorRef,
    // tslint:disable-next-line:align
    private activeRoute: ActivatedRoute, private events: EventService, private profileUtilSvc: ProfileV2UtillService
  ) {
    if (this.configSvc.userProfile) {
      this.userId = this.configSvc.userProfile.userId
      this.username = this.configSvc.userProfile.userName
      this.department = this.configSvc.userProfile.departmentName
      this.departmentID = this.configSvc.userProfile.rootOrgId
    } else {

      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')) {
        this.departmentID = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')) {
        this.department = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')) {
        this.userId = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.userName')) {
        this.username = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.userName')
      }
    }

    this.createEventForm = new UntypedFormGroup({
      eventPicture: new UntypedFormControl('', [Validators.required]),
      eventTitle: new UntypedFormControl('', [
        Validators.required,
        Validators.pattern(this.eventTitleRegex) // Add your pattern here
      ]),
      // summary: new FormControl('', []),
      description: new UntypedFormControl('', [Validators.required, preventHtmlAndJs()]),
      agenda: new UntypedFormControl('', [preventHtmlAndJs()]),
      // isItKarmayogiTalk: new FormControl('', []),
      eventType: new UntypedFormControl('', [Validators.required]),
      certificateRequired: new UntypedFormControl('no'),
      eventDate: new UntypedFormControl('', [Validators.required]),
      eventTime: new UntypedFormControl('', [Validators.required]),
      eventDurationHours: new UntypedFormControl('', [Validators.required]),
      eventDurationMinutes: new UntypedFormControl('', []),
      conferenceLink: new UntypedFormControl('', [Validators.required, Validators.pattern(this.myreg)]),
      presenters: new UntypedFormControl('', []),
      state: new UntypedFormControl('', []),
    })

    this.createEventForm.get('eventType')?.disable()
    this.createEventForm.get('state')?.disable()

    this.activeRoute.params.subscribe(params => {
      this.eventId = params['id']
      this.eventsSvc.getEventDetailsInEditMode(this.eventId).subscribe(res => {
        const eventObj = res.result.event
        this.eventObject = eventObj
        this.createEventForm.controls['eventPicture'].setValue(eventObj.appIcon)
        this.createEventForm.controls['eventTitle'].setValue(eventObj.name)
        // this.createEventForm.controls['summary'].setValue(eventObj.instructions)
        this.createEventForm.controls['description'].setValue(eventObj.description)
        if (eventObj.learningObjective) {
          this.createEventForm.controls['agenda'].setValue(eventObj.learningObjective)
        }
        const newendDate = `${eventObj.startDate} ${eventObj.startTime}`
        const eTime = new Date(newendDate).valueOf()
        const cDate = new Date().valueOf()
        if (eventObj.resourceType === 'Webinar') {
          this.getLink(eventObj)
        } else if (eTime < cDate) {
          this.getLink(eventObj)
        } else {
          this.createEventForm.controls['conferenceLink'].setValue(eventObj.registrationLink)
        }
        this.createEventForm.controls['eventTime'].setValue(eventObj.endDate)
        this.createEventForm.controls['eventType'].setValue(eventObj.resourceType)
        this.createEventForm.controls['certificateRequired'].setValue(
          String(eventObj.certificateRequired || '').toLowerCase() === 'yes' ? 'yes' : 'no'
        )
        this.todayDate = new Date((new Date(eventObj.endDate).getTime()))
        const dateStr = eventObj.startTime.split(':')
        this.todayTime = `${dateStr[0]}:${dateStr[1]}`
        this.hours = Math.floor(eventObj.duration / 60)
        this.minutes = eventObj.duration % 60
        this.createEventForm.controls['eventDurationHours'].setValue(this.hours)
        this.createEventForm.controls['eventDurationMinutes'].setValue(this.minutes)
        this.imageSrcURL = eventObj.appIcon
        this.eventimageURL = eventObj.appIcon

        if (eventObj && eventObj.resourceTypeDetails && eventObj.resourceTypeDetails.stateOrMinistryName && eventObj.resourceType === 'Rajya Karmayogi Saptah') {
          this.showRajyaField = true
          this.getSlwResourceTypeDetail(eventObj)

        } else {
          this.showRajyaField = false
        }
        // this.eventimageURL = eventObj.appIcon && (eventObj.appIcon !== null || eventObj.appIcon !== undefined) ?
        //   this.eventsSvc.getPublicUrl(eventObj.appIcon) : this.eventsSvc.getPublicUrl('/assets/icons/Events_default.png')
        const presents = eventObj.creatorDetails
        if (presents) {
          this.presentersArr = []
          for (const obj of JSON.parse(presents.replace(/\\/g, ''))) {
            const setSelectedPresentersObj = {
              firstname: obj.name ? obj.name : obj.firstname,
              email: obj.email,
              type: 'Karmayogi User',
              mdoName: obj.mdoName,
            }
            this.presentersArr.push(setSelectedPresentersObj)
            this.participantsArr.push(setSelectedPresentersObj)
            this.createEventForm.controls['presenters'].setValue(this.presentersArr)
          }
        }
        const expiryDateFormat = this.getCustomDateFormat(eventObj.endDate, eventObj.endTime)
        if (this.compareDate(expiryDateFormat)) {
          this.fullEdit = false
          this.createEventForm.get('eventTitle')?.disable()
          this.createEventForm.get('description')?.disable()
          this.createEventForm.get('agenda')?.disable()

          this.createEventForm.get('eventDate')?.disable()
          this.createEventForm.get('eventTime')?.disable()
          this.createEventForm.get('eventDurationHours')?.disable()
          this.createEventForm.get('eventDurationMinutes')?.disable()
          this.createEventForm.get('certificateRequired')?.disable()
        } else {
          this.fullEdit = true
        }
        this.changeDetectorRefs.detectChanges()
        if (eventObj?.endDate) {
          this.filterTimeSlotsByDate(new Date(eventObj?.endDate))
        }
      })
    })

    // this.createEventForm.controls['eventDurationHours'].setValue(0)
    // this.createEventForm.controls['eventDurationMinutes'].setValue(30)
    // this.createEventForm.controls['eventType'].setValue('Webinar')
    const minCurrentDate = new Date()
    const maxNewDate = new Date()
    this.minDate = minCurrentDate
    this.maxDate = maxNewDate.setMonth(maxNewDate.getMonth() + 1)
    // this.todayDate = new Date((new Date().getTime()))
    // this.todayTime = '00:00'
  }

  getLink(eventObj: any) {
    if (eventObj.recordedLinks && eventObj.recordedLinks.length > 0) {
      this.createEventForm.controls['conferenceLink'].setValue(eventObj.recordedLinks[0])
    } else {
      this.createEventForm.controls['conferenceLink'].setValue(eventObj.registrationLink)
    }
  }

  compareDate(selectedDate: any) {
    const now = new Date()
    const today = moment(now).format('YYYY-MM-DD HH:mm')
    return (selectedDate < today) ? true : false
  }

  getCustomDateFormat(date: any, time: any) {
    const stime = time.split('+')[0]
    const hour = stime.substr(0, 2)
    const min = stime.substr(2, 3)
    return `${date} ${hour}${min}`
  }

  ngOnInit() {
    this.activeRoute?.queryParams.subscribe(params => {
      this.filter = params['filter']
    })

    // if (this.configSvc?.eventBufferTimeInMinutes) {
    //   this.eventBufferTime = this.configSvc?.eventBufferTimeInMinutes
    // }

    this.orgtimeArr = this.timeArr?.map(slot => ({ ...slot })) // Deep copy

    if (this.timeArr) {
      const now = new Date()
      now.setMinutes(now.getMinutes() + this.eventBufferTime) // assuming this.eventBufferTime = 30

      // Format buffered time as "HH:mm"
      const bufferedTime = `${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}`

      // Update time array with disabled flags
      this.newtimearray = this.timeArr.map(slot => {
        return {
          value: slot?.value,
          disabled: slot?.value <= bufferedTime
        }
      })
    }
  }
  filterTimeSlotsByDate(event: Date): void {
    const selected = new Date(event)
    const today = new Date()
    const isToday =
      selected.getDate() === today?.getDate() &&
      selected.getMonth() === today?.getMonth() &&
      selected.getFullYear() === today?.getFullYear()

    if (isToday) {
      this.timeArr = this.newtimearray
    } else {
      this.timeArr = this.orgtimeArr?.map(slot => ({ value: slot?.value, disabled: false }))
    }
    this.todayTime = this.createEventForm?.get('eventTime')?.value || this.timeArr[0]?.value
  }

  openDialog() {
    this.dialogRef = this.matDialog.open(ParticipantsComponent, {
      width: '850px',
      height: '600px',
    })
    this.dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        this.addPresenters(response)
      }
    })
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
      },
      {}
    )
  }

  addPresenters(responseObj: any) {
    Object.keys(responseObj.data).forEach((index: any) => {
      const obj = responseObj.data[index]
      const setSelectedPresentersObj = {
        firstname: obj.firstName || obj.firstname,
        email: this.profileUtilSvc.emailTransform(obj.profileDetails.personalDetails.primaryEmail),
        type: 'Karmayogi User',
        mdoName: obj.rootOrgName,
      }

      this.presentersArr.push(setSelectedPresentersObj)
      this.participantsArr.push(setSelectedPresentersObj)
      this.changeDetectorRefs.detectChanges()
      this.createEventForm.controls['presenters'].setValue(this.presentersArr)
    })
  }

  close() {
    this.dialogRef.close()
  }

  selectCover() {
    this.pictureObj = document.getElementById('coverPicture')
    this.pictureObj.click()
    this.createEventForm.controls['eventPicture'].markAsTouched()
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
      },
      {}
    )
  }

  onFileSelect(event: any) {
    this.errorMessages = ''
    if (event.target.files.length > 0) {

      const mimeType = event.target.files[0].type
      if (mimeType.match(/image\/*/) == null) {
        this.errorMessages = `Please upload the file in either PNG, JPG, or JPEG format. Unfortunately,
          we can only accept files with these extensions at the moment.`
        return
      }
      if (event.target.files[0].size > 512000) {
        this.errorMessages = `The file you are trying to upload exceeds the maximum allowed size of 500KB.
        Please choose a smaller file and try again.`
        return
      }

      const reader = new FileReader()
      const file = event.target.files[0]
      reader.onload = () => this.imageSrcURL = reader.result
      reader.readAsDataURL(file)
      this.imageSrc = file
      this.createEventForm.controls['eventPicture'].setValue(this.imageSrc)

      const org = []
      const createdforarray: any[] = []
      createdforarray.push(this.departmentID)
      org.push(this.department)

      const request = {
        request: {
          content: {
            name: 'image asset',
            creator: this.username,
            createdBy: this.userId,
            code: 'image asset',
            mimeType: this.imageSrc.type,
            mediaType: 'image',
            contentType: 'Asset',
            primaryCategory: 'Asset',
            organisation: org,
            createdFor: createdforarray,
          },
        },
      }
      // start the upload and save the progress map
      this.eventsSvc.crreateAsset(request).subscribe((res: any) => {
        const contentID = res.result.identifier
        const formData: FormData = new FormData()
        formData.append('data', file)

        this.eventsSvc.uploadFile(contentID, formData).subscribe((fdata: any) => {
          this.eventimageURL = fdata.result.artifactUrl
          event.target.value = ''
        })
      })
    }
  }

  removeSelectedFile() {
    this.imageSrcURL = ''
    this.createEventForm.controls['eventPicture'].setValue('')
    this.createEventForm.controls['eventPicture'].markAsTouched()
    this.eventimageURL = ''
  }

  changeEventType(event: any) {
    this.createEventForm.controls['eventType'].setValue(event.target.value)
  }

  updateDate(event: any) {
    const selected = new Date(event?.value)
    const today = new Date()
    const isToday =
      selected.getDate() === today?.getDate() &&
      selected.getMonth() === today?.getMonth() &&
      selected.getFullYear() === today?.getFullYear()

    if (isToday) {
      this.timeArr = this.newtimearray
    } else {
      this.timeArr = this.orgtimeArr.map(slot => ({ value: slot?.value, disabled: false }))
    }
    this.todayTime = this.createEventForm?.get('eventTime')?.value || this.timeArr[0]?.value
  }

  onSubmit() {
    this.disableCreateButton = true
    this.displayLoader = true
    const eventDurationMinutes = this.addMinutes(
      this.createEventForm.controls['eventDurationHours'].value,
      this.createEventForm.controls['eventDurationMinutes'].value
    )
    const timeArr = this.createEventForm.controls['eventTime'].value.split(':')
    const todayDate = moment(new Date()).valueOf()
    const expiryDateTime = moment(this.createEventForm.controls['eventDate'].value)
      .set('hour', timeArr[0])
      .set('minute', timeArr[1]).format('YYYYMMDDTHHmmss+0000')

    const startTimeArr = this.createEventForm.controls['eventTime'].value.split(':')
    // tslint:disable-next-line:radix
    const startMinutes = (startTimeArr[0] * 60) + parseInt(startTimeArr[1])
    // tslint:disable-next-line:radix
    const endMinutes = parseInt(this.createEventForm.controls['eventDurationHours'].value) * 60
    // tslint:disable-next-line:radix
    const totalMinutes = startMinutes + endMinutes + parseInt(this.createEventForm.controls['eventDurationMinutes'].value || 0)
    // tslint:disable-next-line:prefer-template
    let hours = (Math.floor(totalMinutes / 60) < 10) ? '0' + Math.floor(totalMinutes / 60) : Math.floor(totalMinutes / 60)
    // tslint:disable-next-line:prefer-template
    const hoursStr = (Math.floor(totalMinutes / 60) < 10) ? '0' + Math.floor(totalMinutes / 60) : Math.floor(totalMinutes / 60)
    hours = Number(hours)
    const minutes = totalMinutes % 60
    // tslint:disable-next-line:prefer-template
    const minutesstr = (Math.floor(minutes) < 10) ? '0' + Math.floor(minutes) : Math.floor(minutes)
    let finalTime
    let newendDate
    const eventDate = moment(this.createEventForm.controls['eventDate'].value).add((totalMinutes - 330), 'minutes').valueOf()
    if (hours < 24) {
      if (minutes === 0) {
        // tslint:disable-next-line:prefer-template
        finalTime = hoursStr + ':' + '00' + ':00+05:30'
      } else if (hours === 0) {
        // tslint:disable-next-line:prefer-template
        finalTime = '00' + ':' + minutesstr + ':00+05:30'
      } else {
        // tslint:disable-next-line:prefer-template
        finalTime = hoursStr + ':' + minutesstr + ':00+05:30'
      }
    } else {
      if (hours === 0) {
        // tslint:disable-next-line:prefer-template
        finalTime = '00' + ':' + minutesstr + ':00+05:30'
      } else {
        const fhr = Number(hours)
        // tslint:disable-next-line:prefer-template
        const nhr = ('0' + (fhr - 24)).slice(-2)
        if (minutes === 0) {
          // tslint:disable-next-line:prefer-template
          finalTime = nhr + ':' + '00' + ':00+05:30'
        } else {
          // tslint:disable-next-line:prefer-template
          finalTime = nhr + ':' + minutesstr + ':00+05:30'
        }
        const selectedStartDate = this.createEventForm.controls['eventDate'].value
        // tslint:disable-next-line:prefer-template
        const date = ('0' + (new Date(selectedStartDate).getDate() + 1)).slice(-2)
        // tslint:disable-next-line:prefer-template
        const month = ('0' + (new Date(selectedStartDate).getMonth() + 1)).slice(-2)
        const year = new Date(selectedStartDate).getFullYear()
        newendDate = `${year}-${month}-${date}`
      }
      this.events.raiseInteractTelemetry(
        {
          type: TelemetryEvents.EnumInteractTypes.CLICK,
          subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
        },
        {}
      )
    }

    const createdforarray: any[] = []
    createdforarray.push(this.departmentID)

    if (eventDate < todayDate) {
      const linkArry = []
      linkArry.push(this.createEventForm.controls['conferenceLink'].value)
      // form.request.event.recordedLinks = arry
      this.reqPayload = {
        request: {
          event: {
            mimeType: 'application/html',
            locale: 'en',
            isExternal: true,
            name: this.createEventForm.controls['eventTitle'].value,
            description: this.createEventForm.controls['description'].value,
            // instructions: this.createEventForm.controls['summary'].value,
            appIcon: this.eventimageURL,
            category: 'Event',
            createdBy: this.userId,
            authoringDisabled: false,
            isContentEditingDisabled: false,
            isMetaEditingDisabled: false,
            learningObjective: this.createEventForm.controls['agenda'].value,
            expiryDate: expiryDateTime,
            duration: eventDurationMinutes,
            // registrationLink: this.createEventForm.controls['conferenceLink'].value,
            // recordedLinks: linkArry,
            resourceType: this.createEventForm.controls['eventType'].value,
            categoryType: 'Article',
            creatorDetails: this.createEventForm.controls['presenters'].value,
            sourceName: this.department,
            startDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            endDate: newendDate ? newendDate : moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            // tslint:disable-next-line:prefer-template
            startTime: this.createEventForm.controls['eventTime'].value + ':00+05:30',
            endTime: finalTime,
            code: this.createEventForm.controls['eventTitle'].value,
            eventType: 'Online',
            registrationEndDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            owner: this.department,
            createdFor: createdforarray,
            identifier: this.eventId,
            versionKey: this.eventObject.versionKey,
            startDateTime: this.combineDateAndTime(
              moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
              this.createEventForm.controls['eventTime'].value + ':00+05:30'),
            endDateTime: this.combineDateAndTime(
              newendDate ? newendDate : moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
              finalTime
            ),
          },
        },
      }
    } else {
      this.reqPayload = {
        request: {
          event: {
            mimeType: 'application/html',
            locale: 'en',
            isExternal: true,
            name: this.createEventForm.controls['eventTitle'].value,
            description: this.createEventForm.controls['description'].value,
            // instructions: this.createEventForm.controls['summary'].value,
            appIcon: this.eventimageURL,
            category: 'Event',
            createdBy: this.userId,
            authoringDisabled: false,
            isContentEditingDisabled: false,
            isMetaEditingDisabled: false,
            learningObjective: this.createEventForm.controls['agenda'].value,
            expiryDate: expiryDateTime,
            duration: eventDurationMinutes,
            //registrationLink: this.youTubeUrlChange(this.createEventForm.controls['conferenceLink'].value),
            resourceType: this.createEventForm.controls['eventType'].value,
            categoryType: 'Article',
            creatorDetails: this.createEventForm.controls['presenters'].value,
            sourceName: this.department,
            startDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            endDate: newendDate ? newendDate : moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            // tslint:disable-next-line:prefer-template
            startTime: this.createEventForm.controls['eventTime'].value + ':00+05:30',
            endTime: finalTime,
            code: this.createEventForm.controls['eventTitle'].value,
            eventType: 'Online',
            registrationEndDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            owner: this.department,
            createdFor: createdforarray,
            identifier: this.eventId,
            versionKey: this.eventObject.versionKey,
            startDateTime: this.combineDateAndTime(
              moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
              this.createEventForm.controls['eventTime'].value + ':00+05:30'),
            endDateTime: this.combineDateAndTime(
              newendDate ? newendDate : moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
              finalTime
            ),
          },
        },
      }
    }

    if (this.createEventForm.controls['eventType'].value === 'Webinar') {
      if (eventDate < todayDate) {
        this.reqPayload.request.event.recordedLinks = [this.youTubeUrlChange(this.createEventForm.controls['conferenceLink'].value)]
      } else {
        this.reqPayload.request.event.registrationLink = this.youTubeUrlChange(this.createEventForm.controls['conferenceLink'].value)
      }
    } else {
      this.reqPayload.request.event.registrationLink = this.youTubeUrlChange(this.createEventForm.controls['conferenceLink'].value)
    }

    this.reqPayload.request.event.certificateRequired =
      this.createEventForm.controls['certificateRequired'].value === 'yes' ? 'Yes' : 'No'

    if (this.createEventForm.controls['state'] && this.createEventForm.controls['state'].value && this.showRajyaField) {
      this.reqPayload['request']['event']['resourceTypeDetails'] = this.getStateDetail()
    }
    // const formJson = this.encodeToBase64(form)
    if (eventDurationMinutes === 0) {
      this.displayLoader = false
      this.disableCreateButton = false
      this.openSnackbar('Duration cannot be zero')
    } else {
      this.eventsSvc.updateEvent(this.eventId, this.reqPayload).subscribe(
        (res: any) => {
          if (res) {
            // console.log('res', res)
            this.disableCreateButton = false
            const identifier = res.result.identifier
            const versionKey = res.result.versionKey
            this.publishEvent(identifier, versionKey)
            // setTimeout(() => {
            //   this.displayLoader = false
            //   this.openSnackbar('Event details are successfuly updated.')
            //   this.router.navigate([`/app/home/events`])
            // }, 5000)
          }
        },
        (err: any) => {
          this.displayLoader = false
          this.disableCreateButton = false
          this.openSnackbar(err.error.split(':')[1])
        }
      )
    }
  }

  onSubmitClick() {
    const certificateRequiredControl = this.createEventForm.controls['certificateRequired']
    if (certificateRequiredControl.disabled || certificateRequiredControl.value !== 'yes') {
      this.onSubmit()
      return
    }

    const confirmationDialog = this.matDialog.open(ConfirmationPopupComponent, {
      disableClose: true,
      panelClass: 'certificate-confirmation-dialog',
      data: {
        type: 'conformation',
        title: [
          'Are you sure you want to award certificates to attendees of this event?',
          'If not, please cancel and disable the "Event with Certificate" option.',
        ].join(' '),
        subTitle: 'Please confirm to proceeed.',
        primaryAction: 'Proceed',
        secondaryAction: 'Cancel',
        isCertificateConfirmation: true,
      },
      autoFocus: false,
    })

    confirmationDialog.afterClosed().subscribe((response: any) => {
      if (response === 'confirmed') {
        this.onSubmit()
      }
    })
  }

  publishEvent(identifierkey: any, versionKey: any) {
    const reqestBody = {
      request: {
        event: {
          versionKey,
          status: 'Live',
          identifier: identifierkey,
        },
      },
    }
    this.eventsSvc.publishEvent(identifierkey, reqestBody).subscribe(
      res => {
        // tslint:disable-next-line:align
        console.log("res", res)
        setTimeout(() => {
          this.displayLoader = false
          this.openSnackbar('Event details are successfuly updated.')
          this.router.navigate([`/app/home/events`])
        }, 5000)
      },
      (err: any) => {
        this.openSnackbar(err.error.split(':')[1])
      }
    )
  }

  onCertificateRequiredChange(checked: boolean) {
    this.createEventForm.controls['certificateRequired'].setValue(checked ? 'yes' : 'no')
  }

  combineDateAndTime(date: any, time: any) {
    const combinedDateTime = `${date}T${time}`
    const dateObj = new Date(combinedDateTime)
    const isoString = dateObj.toISOString()
    return isoString.replace('Z', '+0000')
  }

  encodeToBase64(body: any) {
    const sString = JSON.stringify(body)
    const aUTF16CodeUnits = new Uint16Array(sString.length)
    Array.prototype.forEach.call(aUTF16CodeUnits, (_el, idx, arr) => arr[idx] = sString.charCodeAt(idx))
    return { data: btoa(new Uint8Array(aUTF16CodeUnits.buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')) }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  addMinutes(hrs: number, mins: number) {
    if (mins > 0) {
      return (hrs * 60) + mins
    }
    const minutes = (hrs * 60) + 0
    return minutes
  }

  goToList() {
    this.router.navigate([`/app/home/events`]), // NOSONAR
      // this.telemetrySvc.impression()

      this.events.raiseInteractTelemetry(
        {
          type: TelemetryEvents.EnumInteractTypes.CLICK,
          subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
        },
        {}
      )
  }
  showSuccess(res: any) {
    this.dialogRef = this.matDialog.open(SuccessComponent, {
      width: '612px',
      data: res,
      panelClass: 'remove-overflow',
    })
    this.dialogRef.afterClosed().subscribe(() => {
      this.router.navigate([`/app/home/events`])
    })
  }

  resetDateField() {
    let eventTypeControl = this.createEventForm.get('eventType')
    if (eventTypeControl && eventTypeControl.value === 'Rajya Karmayogi Saptah') {
      this.showRajyaField = true
      this.createEventForm.controls['state'].setValidators([Validators.required])
    } else {
      this.showRajyaField = false
      this.createEventForm.controls['state'].setValidators([])
    }
  }

  getSlwResourceTypeDetail(eventObj: any) {
    let payload = {
      "request": {
        "type": "page",
        "subType": "slwResourceTypeDetails",
        "action": "page-configuration",
        "component": "spv", "rootOrgId": "*"
      }
    }
    this.eventsSvc.getSlwResourceTypeDetail(payload).subscribe((data) => {
      if (data && data.slwResourceTypeDetails && data.slwResourceTypeDetails.length) {
        this.stateList = data.slwResourceTypeDetails
        if (this.stateList && this.stateList.length) {
          this.showRajyaField = true
          setTimeout(() => {
            const control = this.createEventForm.get('state')
            if (control) {
              control.setValue(eventObj.resourceTypeDetails.stateOrMinistryName)

            }
          }, 0)

        }

        //this.createEventForm.get['state'].setValue(this.stateList[0]['stateOrMinistryName'])
      }

      this.createEventForm.controls['state'].setValidators([Validators.required])
    })

  }

  getStateDetail() {
    let payload: any
    if (this.createEventForm.controls['state'].value) {
      payload = this.stateList.filter((item: any) => {
        if (item && item.stateOrMinistryName && item.stateOrMinistryName === this.createEventForm.controls['state'].value) {
          return item
        }
      })
    }

    console.log('payload', payload)
    console.log('value', this.createEventForm.controls['state'].value)
    return payload && payload[0] ? payload[0] : null
  }

  youTubeUrlChange(url: string): string {

    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url.match(regExp)
    return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  ngOnDestroy() {
    this.stateList = []
  }
}
