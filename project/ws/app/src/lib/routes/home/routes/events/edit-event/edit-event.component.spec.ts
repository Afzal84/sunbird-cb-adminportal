import { EditEventComponent } from './edit-event.component'
import { of, throwError } from 'rxjs'

// Mock classes for dependencies
class MockMatSnackBar {
	open = jest.fn().mockReturnValue({ dismiss: jest.fn() });
}

class MockEventsService {
	getEventDetailsInEditMode = jest.fn().mockReturnValue(of({
		result: {
			event: {
				appIcon: 'mock-icon-url',
				name: 'Mock Event',
				description: 'Mock Description',
				learningObjective: 'Mock Agenda',
				registrationLink: 'https://example.com/meeting',
				resourceType: 'Webinar',
				endDate: '2026-11-25',
				startTime: '10:00',
				endTime: '23:00:00+05:30',
				duration: 90,
				creatorDetails: JSON.stringify([{ name: 'John Doe', email: 'john@example.com', mdoName: 'Test Department' }]),
				versionKey: 'mock-version-key'
			}
		}
	}));
	crreateAsset = jest.fn().mockReturnValue(of({ result: { identifier: 'mock-content-id' } }));
	uploadFile = jest.fn().mockReturnValue(of({ result: { artifactUrl: 'mock-artifact-url' } }));
	updateEvent = jest.fn().mockReturnValue(of({ result: { identifier: 'mock-event-id' } }));
	publishEvent = jest.fn().mockReturnValue(of({ result: { identifier: 'mock-event-id' } }));
}

class MockMatDialog {
	open = jest.fn().mockReturnValue({
		afterClosed: () => of({ data: [] })
	});
}

class MockRouter {
	navigate = jest.fn();
}

class MockConfigurationsService {
	userProfile = {
		userId: 'mock-user-id',
		userName: 'mock-username',
		departmentName: 'Mock Department',
		rootOrgId: 'mock-root-org-id'
	};
}

class MockChangeDetectorRef {
	detectChanges = jest.fn();
}

class MockActivatedRoute {
	params = of({ id: 'mock-event-id' });
	queryParams = of({ filter: 'all' });
	snapshot = {
		data: {
			configService: {
				userProfile: {
					rootOrgId: 'mock-root-org-id',
					departmentName: 'Mock Department',
					userId: 'mock-user-id',
					userName: 'mock-username'
				}
			}
		}
	};
}

class MockEventService {
	raiseInteractTelemetry = jest.fn();
}

class MockProfileV2UtillService {
	emailTransform = jest.fn(email => email);
}

describe('EditEventComponent', () => {
	let component: EditEventComponent
	let mockSnackBar: MockMatSnackBar
	let mockEventsService: MockEventsService
	let mockMatDialog: MockMatDialog
	let mockRouter: MockRouter
	let mockConfigSvc: MockConfigurationsService
	let mockChangeDetectorRefs: MockChangeDetectorRef
	let mockActiveRoute: MockActivatedRoute
	let mockEvents: MockEventService
	let mockProfileUtilSvc: MockProfileV2UtillService

	beforeEach(() => {
		// Create new instances of mocks for each test
		mockSnackBar = new MockMatSnackBar()
		mockEventsService = new MockEventsService()
		mockMatDialog = new MockMatDialog()
		mockRouter = new MockRouter()
		mockConfigSvc = new MockConfigurationsService()
		mockChangeDetectorRefs = new MockChangeDetectorRef()
		mockActiveRoute = new MockActivatedRoute()
		mockEvents = new MockEventService()
		mockProfileUtilSvc = new MockProfileV2UtillService()

		// Initialize component with mocked dependencies
		component = new EditEventComponent(
			mockSnackBar as any,
			mockEventsService as any,
			mockMatDialog as any,
			mockRouter as any,
			mockConfigSvc as any,
			mockChangeDetectorRefs as any,
			mockActiveRoute as any,
			mockEvents as any,
			mockProfileUtilSvc as any
		)
		component.createEventForm.get('eventDate')?.setValue(new Date('2026-11-25'))
		component.createEventForm.get('eventTime')?.setValue('10:00')

		// Set up some spies
		jest.spyOn(document, 'getElementById').mockReturnValue({
			click: jest.fn()
		} as any)

		// Mock current date to ensure consistent test results
		jest.spyOn(Date.prototype, 'getTime').mockReturnValue(new Date('2025-02-25').getTime())
		jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10)
		jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30)
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	test('should initialize the component', () => {
		component.ngOnInit()
		expect(component).toBeDefined()
		expect(component.userId).toBe('mock-user-id')
		expect(component.username).toBe('mock-username')
		expect(component.department).toBe('Mock Department')
	})

	test('should load event details on init', () => {
		expect(mockEventsService.getEventDetailsInEditMode).toHaveBeenCalledWith('mock-event-id')
		expect(component.eventObject).toBeDefined()
		expect(component.createEventForm.get('eventTitle')?.value).toBe('Mock Event')
		expect(component.createEventForm.get('description')?.value).toBe('Mock Description')
		expect(component.createEventForm.get('conferenceLink')?.value).toBe('https://example.com/meeting')
		expect(component.createEventForm.get('eventType')?.value).toBe('Webinar')
		expect(component.createEventForm.get('certificateRequired')?.value).toBe('no')
		expect(component.hours).toBe(1)
		expect(component.minutes).toBe(30)
	})

	test('should open dialog when openDialog is called', () => {
		component.openDialog()
		expect(mockMatDialog.open).toHaveBeenCalled()
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	test('should handle file selection correctly', () => {
		const mockFile = new File([''], 'test.png', { type: 'image/png' })
		const mockEvent = {
			target: {
				files: [mockFile],
				value: ''
			}
		}

		// Mock FileReader
		const mockFileReader = {
			onload: null,
			readAsDataURL: jest.fn(function () {
				if (this.onload) {
					this.onload({ target: { result: 'data:image/png;base64,mock-data' } })
				}
			})
		}

		global.FileReader = jest.fn(() => mockFileReader) as any

		component.onFileSelect(mockEvent)

		expect(component.imageSrc).toBe(mockFile)
		expect(component.createEventForm.get('eventPicture')?.value).toBe(mockFile)
		expect(mockEventsService.crreateAsset).toHaveBeenCalled()
		expect(mockEvent.target.value).toBe('')
	})

	test('should handle file selection with invalid file type', () => {
		const mockFile = new File([''], 'test.txt', { type: 'text/plain' })
		const mockEvent = {
			target: {
				files: [mockFile]
			}
		}

		component.onFileSelect(mockEvent)

		expect(component.errorMessages).toContain('PNG, JPG, or JPEG')
	})

	test('should handle file selection with file too large', () => {
		const mockFile = new File([''], 'test.png', { type: 'image/png' })
		Object.defineProperty(mockFile, 'size', { value: 600000 })

		const mockEvent = {
			target: {
				files: [mockFile]
			}
		}

		component.onFileSelect(mockEvent)

		expect(component.errorMessages).toContain('500KB')
	})

	test('should remove selected file when removeSelectedFile is called', () => {
		component.imageSrcURL = 'mock-url'
		component.eventimageURL = 'mock-url'

		component.removeSelectedFile()

		expect(component.imageSrcURL).toBe('')
		expect(component.eventimageURL).toBe('')
		expect(component.createEventForm.get('eventPicture')?.value).toBe('')
	})

	test('should add presenters when addPresenters is called', () => {
		component.presentersArr = []
		component.participantsArr = []
		const mockResponseObj = {
			data: {
				'0': {
					firstName: 'Jane',
					rootOrgName: 'Test Org',
					profileDetails: {
						personalDetails: {
							primaryEmail: 'jane@example.com'
						}
					}
				}
			}
		}

		component.addPresenters(mockResponseObj)

		expect(component.presentersArr.length).toBe(1)
		expect(component.participantsArr.length).toBe(1)
		expect(component.presentersArr[0].firstname).toBe('Jane')
		expect(component.presentersArr[0].email).toBe('jane@example.com')
		expect(mockChangeDetectorRefs.detectChanges).toHaveBeenCalled()
	})

	test('should calculate addMinutes correctly', () => {
		expect(component.addMinutes(2, 30)).toBe(150)
		expect(component.addMinutes(1, 0)).toBe(60)
	})

	test('should handle form submission successfully', () => {
		// Set up form values
		component.createEventForm.get('eventTitle')?.setValue('Updated Event')
		component.createEventForm.get('description')?.setValue('Updated Description')
		component.createEventForm.get('agenda')?.setValue('Updated Agenda')
		component.createEventForm.get('eventType')?.setValue('Webinar')
		component.createEventForm.get('eventDate')?.setValue(new Date('2025-03-01'))
		component.createEventForm.get('eventTime')?.setValue('10:00')
		component.createEventForm.get('eventDurationHours')?.setValue(1)
		component.createEventForm.get('eventDurationMinutes')?.setValue(30)
		component.createEventForm.get('conferenceLink')?.setValue('https://example.com/updated')
		component.createEventForm.get('presenters')?.setValue([{ firstname: 'Test', email: 'test@example.com', type: 'Karmayogi User', mdoName: 'Test Org' }])
		component.eventimageURL = 'mock-image-url'
		component.eventId = 'mock-event-id'
		component.eventObject = { versionKey: 'mock-version-key' }

		component.onSubmit()

		expect(component.disableCreateButton).toBe(false)
		expect(component.displayLoader).toBe(true)
		expect(mockEventsService.updateEvent).toHaveBeenCalled()

		// Check the request payload
		const payload = mockEventsService.updateEvent.mock.calls[0][1]
		expect(payload.request.event.name).toBe('Updated Event')
		expect(payload.request.event.description).toBe('Updated Description')
		expect(payload.request.event.learningObjective).toBe('Updated Agenda')
		expect(payload.request.event.registrationLink).toBe('https://example.com/updated')
		expect(payload.request.event.identifier).toBe('mock-event-id')
		expect(payload.request.event.versionKey).toBe('mock-version-key')
		expect(payload.request.event.certificateRequired).toBe('No')
	})

	test('should send certificateRequired when updating a non-webinar event', () => {
		component.createEventForm.get('eventType')?.setValue('Karmayogi Talks')
		component.createEventForm.get('certificateRequired')?.setValue('yes')

		component.onSubmit()

		const payload = mockEventsService.updateEvent.mock.calls[0][1]
		expect(payload.request.event.certificateRequired).toBe('Yes')
	})

	test('should submit after confirmation when certificate is enabled', () => {
		const submitSpy = jest.spyOn(component, 'onSubmit').mockImplementation()
		component.createEventForm.get('certificateRequired')?.enable()
		component.createEventForm.get('certificateRequired')?.setValue('yes')
		mockMatDialog.open.mockReturnValue({ afterClosed: () => of('confirmed') })

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

	test('should submit directly without a dialog when certificate is disabled', () => {
		const submitSpy = jest.spyOn(component, 'onSubmit').mockImplementation()
		component.onCertificateRequiredChange(false)

		component.onSubmitClick()

		expect(mockMatDialog.open).not.toHaveBeenCalled()
		expect(submitSpy).toHaveBeenCalledTimes(1)
	})

	test('should submit directly without a dialog when certificate control is disabled for an expired event', () => {
		const submitSpy = jest.spyOn(component, 'onSubmit').mockImplementation()
		component.createEventForm.get('certificateRequired')?.setValue('yes')
		component.createEventForm.get('certificateRequired')?.disable()

		component.onSubmitClick()

		expect(mockMatDialog.open).not.toHaveBeenCalled()
		expect(submitSpy).toHaveBeenCalledTimes(1)
	})

	test('should handle form submission with zero duration', () => {
		component.createEventForm.get('eventDurationHours')?.setValue(0)
		component.createEventForm.get('eventDurationMinutes')?.setValue(0)

		component.onSubmit()

		expect(mockSnackBar.open).toHaveBeenCalledWith('Duration cannot be zero', 'X', { duration: 5000 })
		expect(component.displayLoader).toBe(false)
		expect(component.disableCreateButton).toBe(false)
	})

	test('should handle form submission error', () => {
		component.createEventForm.get('eventTitle')?.setValue('Updated Event')
		component.createEventForm.get('description')?.setValue('Updated Description')
		component.createEventForm.get('eventType')?.setValue('Webinar')
		component.createEventForm.get('eventDate')?.setValue(new Date('2025-03-01'))
		component.createEventForm.get('eventTime')?.setValue('10:00')
		component.createEventForm.get('eventDurationHours')?.setValue(1)
		component.createEventForm.get('eventDurationMinutes')?.setValue(30)
		component.createEventForm.get('conferenceLink')?.setValue('https://example.com/updated')
		component.onCertificateRequiredChange(false)

		// Mock error response
		mockEventsService.updateEvent.mockReturnValue(throwError({ error: 'Error:Update failed' }))

		component.onSubmit()

		const payload = mockEventsService.updateEvent.mock.calls[0][1]
		expect(payload.request.event.certificateRequired).toBe('No')
		expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed', 'X', { duration: 5000 })
		expect(component.displayLoader).toBe(false)
		expect(component.disableCreateButton).toBe(false)
	})

	test('should navigate back to events list when goToList is called', () => {
		component.goToList()

		expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events'])
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	test('should show success dialog when showSuccess is called', () => {
		const mockRes = { eventId: 'mock-event-id' }

		component.showSuccess(mockRes)

		expect(mockMatDialog.open).toHaveBeenCalled()
	})
})
