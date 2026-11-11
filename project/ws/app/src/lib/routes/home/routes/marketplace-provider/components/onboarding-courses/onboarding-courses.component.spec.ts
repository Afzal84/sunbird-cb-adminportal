import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { DatePipe } from '@angular/common'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'

import { OnboardingCoursesComponent } from './onboarding-courses.component'
import { MarketplaceService } from '../../services/marketplace.service'

describe('OnboardingCoursesComponent', () => {
  let component: OnboardingCoursesComponent
  let fixture: ComponentFixture<OnboardingCoursesComponent>
  let marketPlaceSvc: any

  beforeEach(() => {
    marketPlaceSvc = {
      deleteUnPublishedCourses: jest.fn().mockReturnValue(of({})),
      downloadLogs: jest.fn().mockReturnValue(of({})),
      getContentList: jest.fn().mockReturnValue(of({ result: { data: [], totalCount: 0 } })),
      getCoursesList: jest.fn().mockReturnValue(of({ result: { content: [], count: 0 } })),
    }
    TestBed.configureTestingModule({
      declarations: [OnboardingCoursesComponent],
      providers: [
        DatePipe,
        { provide: MarketplaceService, useValue: marketPlaceSvc },
        { provide: MatSnackBar, useValue: { open: jest.fn(), openFromComponent: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(OnboardingCoursesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should not fetch table data when providerDetails is not set', () => {
    expect(marketPlaceSvc.getContentList).not.toHaveBeenCalled()
  })

  it('should disable pagination for upload status', () => {
    expect(component.contentTableData.showPagination).toBe(false)
  })
})
