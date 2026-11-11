import { DatePipe } from '@angular/common';
import { OnboardingCoursesComponent } from './onboarding-courses.component';

describe('OnboardingCoursesComponent', () => {
  let component: OnboardingCoursesComponent;

  beforeEach(() => {
    component = new OnboardingCoursesComponent({} as any, new DatePipe('en-US'), {} as any);
    component.tableDataInitialization();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable pagination for upload status', () => {
    expect(component.contentTableData.showPagination).toBe(false);
  });
});
