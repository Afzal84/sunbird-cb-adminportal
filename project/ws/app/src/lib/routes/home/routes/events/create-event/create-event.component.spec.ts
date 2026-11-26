import { CreateEventComponent } from './create-event.component'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { EventsService } from '../services/events.service'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import { ProfileV2UtillService } from '../services/home-utill.service'
import { PipePublicURL } from '../../../pipes/pipe-public-URL/pipe-public-URL.pipe'
import { of, throwError } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar'

describe('CreateEventComponent', () => {
	let component: CreateEventComponent
	let mockMatDialog: jest.Mocked<MatDialog>
	let mockSnackBar: jest.Mocked<MatSnackBar>
	let mockEventsService: jest.Mocked<EventsService>
	let mockRouter: jest.Mocked<Router>
	let mockConfigService: jest.Mocked<ConfigurationsService>
	let mockEventService: jest.Mocked<EventService>
	let mockProfileUtilService: jest.Mocked<ProfileV2UtillService>
	let mockPipePublicURL: jest.Mocked<PipePublicURL>
	let mockActivatedRoute: Partial<ActivatedRoute>

	beforeEach(() => {
		mockMatDialog = {
			open: jest.fn().mockReturnValue({ afterClosed: () => of({}) }),
		} as any

		mockSnackBar = {
			open: jest.fn(),
		} as any

		mockEventsService = {
			crreateAsset: jest.fn(),
			uploadFile: jest.fn(),
			createEvent: jest.fn(),
			publishEvent: jest.fn(),
			getSlwResourceTypeDetail: jest.fn().mockReturnValue(of({})),
		} as any

		mockRouter = {
			navigate: jest.fn(),
		} as any

		mockConfigService = {
			userProfile: {
				userId: 'test-user-id',
				userName: 'test-user',
				departmentName: 'test-department',
			},
		} as any

		mockEventService = {
			raiseInteractTelemetry: jest.fn(),
		} as any

		mockProfileUtilService = {
			emailTransform: jest.fn(),
		} as any

		mockPipePublicURL = {
			transform: jest.fn(),
		} as any

		mockActivatedRoute = {
			snapshot: {
				data: {
					configService: {
						userProfile: {
							rootOrgId: 'test-org-id',
							departmentName: 'test-department',
							userId: 'test-user-id',
							userName: 'test-user',
						},
					},
				},
				url: [],
				component: null,
				title: '',
				routeConfig: null,
				parent: null,
				firstChild: null,
				params: { id: '123' },
				fragment: 'some-fragment',
				outlet: 'primary',
				queryParams: {
					roleId: 'test-role-id',
				},
				children: [],  // Child routes, which can be empty if there are no children
				pathFromRoot: [],  // The list of activated route snapshots from the root to this snapshot
				root: null as any,  // root should be a mock or null depending on your use case
				paramMap: { get: jest.fn().mockReturnValue('123') } as unknown as ParamMap,
				queryParamMap: { get: jest.fn().mockReturnValue('test') } as unknown as ParamMap
			},
		}

		component = new CreateEventComponent(
			mockSnackBar as any,
			mockEventsService as any,
			mockMatDialog as any,
			mockRouter as any,
			mockConfigService as any,
			{} as any, // ChangeDetectorRef
			mockActivatedRoute as any,
			mockEventService as any,
			mockProfileUtilService as any,
			mockPipePublicURL as any,
			{ setLoaderState: jest.fn() } as any,
		)

		component.ngOnInit()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})

	describe('Form Validation', () => {
		it('should initialize with invalid form', () => {
			expect(component.createEventForm.valid).toBeFalsy()
		})

		it('should validate event title with correct pattern', () => {
			const control = component.createEventForm.controls['eventTitle']
			control.setValue('Valid Event Title 2024')
			expect(control.valid).toBeTruthy()

			control.setValue('Invalid@Title#')
			expect(control.valid).toBeFalsy()
		})

		it('should validate conference link with URL pattern', () => {
			const control = component.createEventForm.controls['conferenceLink']
			control.setValue('https://www.youtube.com/watch?v=validVideoId')
			expect(control.valid).toBeTruthy()

			control.setValue('invalid-url')
			expect(control.valid).toBeFalsy()
		})

		it('should keep certificate attachment on by default and store string values', () => {
			expect(component.createEventForm.controls['certificateRequired'].value).toBe('yes')

			component.onCertificateRequiredChange(true)
			expect(component.createEventForm.controls['certificateRequired'].value).toBe('yes')

			component.onCertificateRequiredChange(false)
			expect(component.createEventForm.controls['certificateRequired'].value).toBe('no')
		})
	})

	describe('Date and Time Handling', () => {
		it('should update time array when date changes', () => {
			const mockEvent = {
				value: new Date(),
			}
			component.updateDate(mockEvent)
			expect(component.timeArr).toBeDefined()
			expect(component.todayTime).toBeDefined()
		})

		it('should calculate duration correctly', () => {
			const result = component.addMinutes(2, 30)
			expect(result).toBe(150) // 2 hours * 60 + 30 minutes
		})
	})

	describe('File Upload', () => {
		it('should handle valid image upload', () => {
			const mockFile = new File([''], 'test.png', { type: 'image/png' })
			const mockEvent = {
				target: {
					files: [mockFile],
				},
			}

			mockEventsService.crreateAsset.mockReturnValue(of({
				result: { identifier: 'test-id' },
			}))

			mockEventsService.uploadFile.mockReturnValue(of({
				result: { artifactUrl: 'test-url' },
			}))

			mockPipePublicURL.transform.mockReturnValue('transformed-url')

			component.onFileSelect(mockEvent)

			expect(mockEventsService.crreateAsset).toHaveBeenCalled()
			expect(component.errorMessages).toBe('')
		})

		it('should handle invalid file type', () => {
			const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' })
			const mockEvent = {
				target: {
					files: [mockFile],
				},
			}

			component.onFileSelect(mockEvent)
			expect(component.errorMessages).toContain('PNG, JPG, or JPEG')
		})
	})

	describe('Event Creation', () => {
		it('should create and publish event successfully', () => {
			const mockCreateResponse = {
				result: {
					identifier: 'test-event-id',
					versionKey: 'test-version',
				},
			}

			const mockPublishResponse = {
				result: 'success',
			}

			mockEventsService.createEvent.mockReturnValue(of(mockCreateResponse))
			mockEventsService.publishEvent.mockReturnValue(of(mockPublishResponse))

			// Setup form with valid data
			component.createEventForm.patchValue({
				eventTitle: 'Test Event',
				eventType: 'Webinar',
				description: 'Test Description',
				eventDate: new Date(),
				eventTime: '10:00',
				eventDurationHours: 1,
				eventDurationMinutes: 30,
				conferenceLink: 'https://test.com',
				eventPicture: 'test.jpg',
			})

			component.onSubmit()

			expect(mockEventsService.createEvent).toHaveBeenCalled()
			expect(mockEventsService.createEvent.mock.calls[0][0].request.event.certificateRequired).toBe('Yes')
			expect(mockEventsService.publishEvent).toHaveBeenCalled()
		})

		it('should send certificateRequired as yes when the toggle is on', () => {
			mockEventsService.createEvent.mockReturnValue(of({
				result: { identifier: 'test-event-id', versionKey: 'test-version' },
			}))
			mockEventsService.publishEvent.mockReturnValue(of({ result: 'success' }))

			component.createEventForm.patchValue({
				eventTitle: 'Test Event',
				eventType: 'Webinar',
				description: 'Test Description',
				eventDate: new Date(),
				eventTime: '10:00',
				eventDurationHours: 1,
				eventDurationMinutes: 30,
				conferenceLink: 'https://test.com',
				eventPicture: 'test.jpg',
				certificateRequired: 'yes',
			})

			component.onSubmit()

			expect(mockEventsService.createEvent.mock.calls[0][0].request.event.certificateRequired).toBe('Yes')
		})

		it('should send certificateRequired for non-webinar events', () => {
			mockEventsService.createEvent.mockReturnValue(of({
				result: { identifier: 'test-event-id', versionKey: 'test-version' },
			}))
			mockEventsService.publishEvent.mockReturnValue(of({ result: 'success' }))

			component.createEventForm.patchValue({
				eventTitle: 'Test Event',
				eventType: 'Karmayogi Talks',
				description: 'Test Description',
				eventDate: new Date(),
				eventTime: '10:00',
				eventDurationHours: 1,
				eventDurationMinutes: 30,
				conferenceLink: 'https://test.com',
				eventPicture: 'test.jpg',
				certificateRequired: 'yes',
			})

			component.onSubmit()

			expect(mockEventsService.createEvent.mock.calls[0][0].request.event.certificateRequired).toBe('Yes')
		})

		it('should handle event creation error', () => {
			mockEventsService.createEvent.mockReturnValue(
				throwError({ error: 'Error:Test error message' })
			)

			component.createEventForm.patchValue({
				eventTitle: 'Test Event',
				eventType: 'Webinar',
				description: 'Test Description',
				eventDate: new Date(),
				eventTime: '10:00',
				eventDurationHours: 1,
				eventDurationMinutes: 30,
				conferenceLink: 'https://test.com',
				eventPicture: 'test.jpg',
			})

			component.onSubmit()

			expect(mockSnackBar.open).toHaveBeenCalledWith(
				'Test error message',
				'X',
				expect.any(Object)
			)
		})
	})

	describe('Certificate confirmation', () => {
		it('should submit after confirmation when certificate is enabled', () => {
			const submitSpy = jest.spyOn(component, 'onSubmit').mockImplementation()
			mockMatDialog.open.mockReturnValue({ afterClosed: () => of('confirmed') } as any)

			component.onSubmitClick()

			expect(mockMatDialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
				disableClose: true,
				data: expect.objectContaining({
					primaryAction: 'Proceed',
					secondaryAction: 'Cancel',
				}),
			}))
			expect(submitSpy).toHaveBeenCalledTimes(1)
		})

		it('should not submit when certificate confirmation is cancelled', () => {
			const submitSpy = jest.spyOn(component, 'onSubmit').mockImplementation()
			mockMatDialog.open.mockReturnValue({ afterClosed: () => of('Cancel') } as any)

			component.onSubmitClick()

			expect(submitSpy).not.toHaveBeenCalled()
		})

		it('should submit directly when certificate is disabled', () => {
			const submitSpy = jest.spyOn(component, 'onSubmit').mockImplementation()
			component.onCertificateRequiredChange(false)

			component.onSubmitClick()

			expect(mockMatDialog.open).not.toHaveBeenCalled()
			expect(submitSpy).toHaveBeenCalledTimes(1)
		})
	})

	describe('Navigation', () => {
		it('should navigate to events list', () => {
			component.goToList()
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events'])
			expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
		})
	})
})
