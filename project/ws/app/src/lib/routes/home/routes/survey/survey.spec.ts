import { SurveyComponent } from './survey.component'
import { of, Subject, throwError } from 'rxjs'
import { environment } from '../../../../../../../../../src/environments/environment'

// Mock dependencies
jest.mock('@angular/material/dialog')
jest.mock('./survey-api/survey-api.service')
jest.mock('@angular/router')

describe('SurveyComponent', () => {
  let component: SurveyComponent
  let mockMatDialog: any
  let mockSurveyApiService: any
  let mockActivatedRoute: any

  beforeEach(() => {
    // Setup mocks
    mockMatDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of({})),
        backdropClick: jest.fn().mockReturnValue(of({}))
      })
    }

    mockSurveyApiService = {
      getSurveyResults: jest.fn()
    }

    mockActivatedRoute = {
      snapshot: {
        data: {
          configService: {
            userProfile: {
              userId: 'test-user-id',
              departmentName: 'test-department',
              rootOrgId: 'test-org-id'
            }
          }
        }
      }
    }

    // Create component instance with mocks
    component = new SurveyComponent(
      mockMatDialog,
      mockActivatedRoute as any,
      mockSurveyApiService
    )
  })

  test('should initialize component', () => {
    expect(component).toBeTruthy()
  })

  test('should initialize configService from route data', () => {
    expect(component.configService).toEqual(mockActivatedRoute.snapshot.data.configService)
  })

  test('should initialize table data structure on ngOnInit', () => {
    // Mock getSurveysData
    component.getSurveysData = jest.fn()

    // Call ngOnInit
    component.ngOnInit()

    // Verify table structure is initialized
    expect(component.tabledata).toBeDefined()
    expect(component.tabledata.columns).toHaveLength(4)
    expect(component.tabledata.columns[0].displayName).toBe('Survey Id')
    expect(component.tabledata.columns[1].displayName).toBe('Survey Name')
    expect(component.tabledata.columns[2].displayName).toBe('Start Date')
    expect(component.tabledata.columns[3].displayName).toBe('End Date')

    // Verify getSurveysData was called
    expect(component.getSurveysData).toHaveBeenCalled()
  })

  test('should open dialog when onCreateClick is called', () => {
    // Setup environment
    (environment as any).sitePath = 'test-site-path'

    // Call method
    component.onCreateClick()

    // Verify dialog was opened with correct params
    expect(mockMatDialog.open).toHaveBeenCalled()
    const dialogArgs = mockMatDialog.open.mock.calls[0]
    expect(dialogArgs[1].data.surveyFileUploadUrl).toBe('https://test-site-path/validation/template/template-selection')
    expect(dialogArgs[1].disableClose).toBe(true)
    expect(dialogArgs[1].width).toBe('95%')
    expect(dialogArgs[1].height).toBe('95%')
  })

  test('should call surveyApiService when getSurveysData is called', () => {
    // Setup mock response
    mockSurveyApiService.getSurveyResults.mockReturnValue(of({
      status: 200,
      SolutionList: []
    }))

    // Call method
    component.getSurveysData()

    // Verify API was called with correct payload
    expect(mockSurveyApiService.getSurveyResults).toHaveBeenCalledWith({
      resourceType: 'Survey'
    })

    // Verify loadSurveyList was updated
    expect(component.loadSurveyList).toBe(true)
  })

  test('should format survey list when getSurveysData returns surveys', () => {
    mockSurveyApiService.getSurveyResults.mockReturnValue(of({
      status: 200,
      SolutionList: [{ SOLUTION_ID: 'survey-1', START_DATE: '2025-01-01T00:00:00' }],
    }))

    component.getSurveysData()

    expect(component.data).toHaveLength(1)
    expect(component.loadSurveyList).toBe(true)
  })

  test('should stop loading when getSurveysData returns an error status', () => {
    mockSurveyApiService.getSurveyResults.mockReturnValue(of({
      status: 400,
      code: 'NOTOK',
      SolutionList: 'Error in getting the list of solutions',
    }))

    component.getSurveysData()

    expect(component.data).toEqual([])
    expect(component.loadSurveyList).toBe(true)
  })

  test('should stop loading when getSurveysData request fails', () => {
    mockSurveyApiService.getSurveyResults.mockReturnValue(throwError({ status: 500 }))

    component.getSurveysData()

    expect(component.data).toEqual([])
    expect(component.loadSurveyList).toBe(true)
  })

  test('should format data correctly when API returns survey data', () => {
    // Setup mock data
    const mockSurveyData = [
      {
        SOLUTION_ID: 'survey-1',
        SOLUTION_NAME: 'Test Survey 1',
        START_DATE: '2025-01-01T00:00:00',
        END_DATE: '2025-02-01T00:00:00'
      },
      {
        SOLUTION_ID: 'survey-2',
        SOLUTION_NAME: 'Test Survey 2',
        START_DATE: '2025-03-01T00:00:00',
        END_DATE: '2025-04-01T00:00:00'
      }
    ]

    // Call formatData method
    component.formatData(mockSurveyData)

    // Verify data was formatted
    expect(component.data).toHaveLength(2)
    expect(component.data[0].START_DATE_ACTUAL).toBeDefined()
    expect(component.data[0].DISPLAY_START_DATE).toBeDefined()
    expect(component.data[0].DISPLAY_END_DATE).toBeDefined()

    // Verify loadSurveyList was updated
    expect(component.loadSurveyList).toBe(true)
  })

  test('should handle date formatting in formatData method', () => {
    // Create a mock date that will properly split with toLocaleString
    const startDate = new Date('2025-02-15')
    startDate.toLocaleString = jest.fn().mockReturnValue('2025-02-15T00:00:00')

    const endDate = new Date('2025-03-15')
    endDate.toLocaleString = jest.fn().mockReturnValue('2025-03-15T00:00:00')

    const mockSurvey = {
      SOLUTION_ID: 'survey-1',
      SOLUTION_NAME: 'Test Survey',
      START_DATE: startDate,
      END_DATE: endDate
    }

    // Call formatData with single item
    component.formatData([mockSurvey])

    // Verify date formatting
    expect(component.data[0].START_DATE).toBe('2025-02-15')
    expect(component.data[0].END_DATE).toBe('2025-03-15')
    expect(component.data[0].DISPLAY_START_DATE).toBe('15-02-2025}')
    expect(component.data[0].DISPLAY_END_DATE).toBe('15-03-2025}')
  })

  test('should refresh survey list after dialog closes', () => {
    jest.useFakeTimers()
    const afterClosed$ = new Subject<any>()
    const dialogRef = {
      afterClosed: jest.fn().mockReturnValue(afterClosed$),
      backdropClick: jest.fn().mockReturnValue(of({})),
      close: jest.fn(),
    }
    mockMatDialog.open.mockReturnValue(dialogRef)
    component.getSurveysData = jest.fn()

    component.onCreateClick()

    // backdrop click closes the dialog
    expect(dialogRef.close).toHaveBeenCalled()

    // Simulate dialog closing
    afterClosed$.next(undefined)
    expect(component.loadSurveyList).toBe(false)

    jest.runAllTimers()

    expect(component.loadSurveyList).toBe(true)
    expect(component.getSurveysData).toHaveBeenCalled()

    jest.useRealTimers()
  })
})
