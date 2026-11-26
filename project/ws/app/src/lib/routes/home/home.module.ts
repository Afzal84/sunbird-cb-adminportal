import { CommsComponent } from './routes/comms/comms.component'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { PipeFilterModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipeRelativeTimeModule } from '@sunbird-cb/utils-v2'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { SbUiResolverModule } from '@sunbird-cb/resolver-v2'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSortModule } from '@angular/material/sort'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableModule } from '@angular/material/table'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatCardModule } from '@angular/material/card'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { InitResolver } from './resolvers/init-resolve.service'
import { RouterModule } from '@angular/router'
import { HomeRoutingModule } from './home.rounting.module'
import { HomeComponent } from './routes/home/home.component'
import { UsersViewComponent } from './routes/users-view/users-view.component'
import {
    AvatarPhotoModule,
    BtnPageBackModuleAdmin,
    UserAutocompleteModule,
    BreadcrumbsOrgModule,
    UIORGTableModule,
    ScrollspyLeftMenuModule,
} from '@sunbird-cb/collection'
// TO-DO need to enable for image crop
// import { ImageCropModule } from './routes/image-crop/image-crop.module'
import { AboutComponent } from './routes/about/about.component'
import { RolesAccessComponent } from './routes/roles-access/roles-access.component'
import { DirectoryViewComponent } from './routes/directory/directroy.component'
import { CreateMdoComponent } from './routes/create-mdo/create-mdo.component'
import { UserPopupComponent } from './routes/user-popup/user-popup'
import { UsersComponent } from './routes/users/users.component'
import { OpenRolesDialogComponent } from './routes/users/components/open-roles-dialog/open-roles-dialog.component'
import { EditDepartmentDialogComponent } from './routes/users/components/edit-department-dialog/edit-department-dialog.component'
import { CreateUserComponent } from './routes/create-user/create-user.component'
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown'
import { UIAdminTableModule } from '../../head/ui-admin-table/ui-admin-table.module'
import { ModerationViewComponent } from './routes/moderation/moderation.component'
import { RolesUsersComponent } from './routes/roles-users/roles-users.component'
import { ReportsComponent } from './routes/reports/reports.component'
import { PositionsModule } from './routes/positions/positions.module'
import { OnboardingRequestsComponent } from './routes/onboarding-requests/onboarding-requests.component'
import { RequestsApprovalComponent } from './routes/requests-approval/requests-approval.component'
import { AcsendingOrderPipe } from './pipes/acsending-order.pipe'
import { RejectReasonDialogComponent } from './routes/reject-reason-dialog/reject-reason-dialog.component'
import { EmailDomainsComponent } from './routes/email-domains/email-domains.component'
import { EventsListComponent } from './routes/events/events-list/events-list.component'
import { EventListViewComponent } from './routes/events/event-list-view/event-list-view.component'
import { EventThumbnailComponent } from './routes/events/event-thumbnail/event-thumbnail.component'
import { CreateEventComponent } from './routes/events/create-event/create-event.component'
import { ParticipantsComponent } from './routes/events/participants/participants.component'
import { SuccessComponent } from './routes/events/success/success.component'
import { PipeEmailPipe } from './pipes/pipe-email.pipe'
import { EditEventComponent } from './routes/events/edit-event/edit-event.component'
import { PipePublicURLModule } from './pipes/pipe-public-URL/pipe-public-URL.module'
import { AcbpReportsComponent } from './routes/acbp-reports/acbp-reports.component'
import { GeneralReportsComponent } from './routes/general-reports/general-reports.component'
import { SectorsComponent } from './routes/sectors/sectors.component'
import { SectorListViewComponent } from './routes/sectors/sector-list-view/sector-list-view.component'
import { AddSectorComponent } from './routes/sectors/add-sector/add-sector.component'
import { EditSectorComponent } from './routes/sectors/edit-sector/edit-sector.component'
import { AddThumbnailComponent } from './routes/add-thumbnail/add-thumbnail.component'
import { AllRequestComponent } from './routes/request/all-request/all-request.component'
import { RequestCopyDetailsComponent } from './routes/request/request-copy-details/request-copy-details.component'
import { CompetencyViewComponent } from './routes/request/competency-view/competency-view.component'
import { ConfirmationPopupComponent } from './routes/request/confirmation-popup/confirmation-popup.component'
import { AssignListPopupComponent } from './routes/request/assign-list-popup/assign-list-popup.component'
import { KCMMappingComponent } from './routes/kcm-mapping/kcm-mapping.component'
import { TaxonomyEditorModule } from '@sunbird-cb/taxonomy-editor'
import { TreeHierarchyModule } from '@sunbird-cb/tree-hierarchy'
import { SingleAssignPopupComponent } from './routes/request/single-assign-popup/single-assign-popup.component'
import { DemoVideoPopupComponent } from './components/demo-video-popup/demo-video-popup.component'
import { PublicGcpUrlPipe } from './pipes/public-gcp-url.pipe'
import { SurveyComponent } from './routes/survey/survey.component'
import { SurveyListComponent } from './routes/survey/survey-list/survey-list.component'
import { SolutionSurveyUploadComponent } from './components/solution-survey-upload/solution-survey-upload.component'
import { CapitalizePipe } from './pipes/capitalize.pipe'
import { PipePublicURL } from './pipes/pipe-public-URL/pipe-public-URL.pipe'
import { ConfirmationBoxComponent } from './components/confirmation-box/confirmation.box.component'
import { SelectedDesignationPopupComponent } from './components/selected-designation-popup/selected-designation-popup.component'
import { ConformationPopupDesignationComponent } from './components/conformation-popup/conformation-popup-designation.component'
import { FileProgressComponent } from './components/file-progress/file-progress.component'
import { RequestCopyDetailsV2Component } from './routes/request/request-copy-details-v2/request-copy-details-v2.component'
import { CreateRequestModule as LibCreateRequestModule } from '@sunbird-cb/consumption'
import { DesignationApprovalListComponent } from './routes/designation-approval/designation-approval-list/designation-approval-list.component'
import { DesignationApprovalListViewComponent } from './routes/designation-approval/designation-approval-list-view/designation-approval-list-view.component'
import { RejectRequestFormComponent } from './routes/reject-request-form/reject-request-form.component'

@NgModule({
    declarations: [
        HomeComponent,
        UsersViewComponent,
        AboutComponent,
        RolesAccessComponent,
        DirectoryViewComponent,
        OnboardingRequestsComponent,
        EmailDomainsComponent,
        RequestsApprovalComponent,
        CreateMdoComponent,
        UserPopupComponent,
        UsersComponent,
        OpenRolesDialogComponent,
        EditDepartmentDialogComponent,
        CreateUserComponent,
        ModerationViewComponent,
        RolesUsersComponent,
        ReportsComponent,
        CommsComponent,
        AcbpReportsComponent,
        GeneralReportsComponent,
        SectorsComponent,
        AddSectorComponent,
        EditSectorComponent,
        AddThumbnailComponent,
        EventsListComponent,
        EventListViewComponent,
        EventThumbnailComponent,
        CreateEventComponent,
        SectorListViewComponent,
        EditEventComponent,
        ParticipantsComponent,
        SuccessComponent,
        AcsendingOrderPipe,
        PipeEmailPipe,
        RejectReasonDialogComponent,
        AllRequestComponent,
        RequestCopyDetailsComponent,
        CompetencyViewComponent,
        ConfirmationPopupComponent,
        AssignListPopupComponent,
        KCMMappingComponent,
        SingleAssignPopupComponent,
        DemoVideoPopupComponent,
        PublicGcpUrlPipe,
        SurveyComponent,
        SurveyListComponent,
        SolutionSurveyUploadComponent,
        CapitalizePipe,
        ConfirmationBoxComponent,
        SelectedDesignationPopupComponent,
        ConformationPopupDesignationComponent,
        FileProgressComponent,
        RequestCopyDetailsV2Component,
        DesignationApprovalListComponent,
        DesignationApprovalListViewComponent,
        RejectRequestFormComponent
    ],
    imports: [
        CommonModule,
        SbUiResolverModule,
        ReactiveFormsModule,
        HomeRoutingModule,
        PositionsModule,
        FormsModule,
        RouterModule,
        MatGridListModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatDividerModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatListModule,
        MatSelectModule,
        MatAutocompleteModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatDialogModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSidenavModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        PipeFilterModule,
        MatDatepickerModule,
        MatNativeDateModule,
        PipeHtmlTagRemovalModule,
        PipeRelativeTimeModule,
        AvatarPhotoModule,
        BreadcrumbsOrgModule,
        PipeOrderByModule,
        BtnPageBackModuleAdmin,
        SbUiResolverModule,
        UserAutocompleteModule,
        MatTooltipModule,
        // TO-DO need to enable for image crop
        // ImageCropModule,
        UIAdminTableModule,
        UIORGTableModule,
        MatTableModule,
        MatSortModule,
        MatSlideToggleModule,
        MatMenuModule,
        MatPaginatorModule,
        PipePublicURLModule,
        ScrollspyLeftMenuModule,
        MatRadioModule,
        MatTooltipModule,
        // TO-DO need to enable for image crop
        // ImageCropModule,
        NgMultiSelectDropDownModule.forRoot(),
        TaxonomyEditorModule,
        TreeHierarchyModule,
        LibCreateRequestModule
    ],
    providers: [
        // CKEditorService,
        // LoaderService,
        InitResolver,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        MatDatepickerModule, MatNativeDateModule,
        ConfirmationPopupComponent, PipePublicURL,
        DatePipe,

    ],
    exports: [AddThumbnailComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeModule {
}
