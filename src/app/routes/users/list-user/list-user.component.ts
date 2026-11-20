import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { PageEvent } from '@angular/material/paginator'
import { ISearchParams, SearchPanelComponent } from './search-panel/search-panel.component'
import { UserAction } from './user-actions-menu/user-actions-menu.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { UsersService } from '../users.service'
import { IUserProfile, IOrganization, SEARCH_FIELD_MAPPINGS, SearchType, UserStatus } from '../models/users.models'
import { CreateUserDialogComponent } from './dialogs/create-user-dialog/create-user-dialog.component'
import { EditUserDetailsDialogComponent } from './dialogs/edit-user-details-dialog/edit-user-details-dialog.component'
import { RoleAssignmentDialogComponent } from './dialogs/role-assignment-dialog/role-assignment-dialog.component'
import { PasswordResetDialogComponent } from './dialogs/password-reset-dialog/password-reset-dialog.component'
import { UserMigrationDialogComponent } from './dialogs/user-migration-dialog/user-migration-dialog.component'
import { UserStatusUpdateDialogComponent } from './dialogs/user-status-update-dialog/user-status-update-dialog.component'
import { HelpDialogComponent } from '../shared/help-dialog/help-dialog.component'
import { UsersService as HomeUsersService } from '@ws/app/src/lib/routes/home/services/users.service'

@Component({
  standalone: false,
  selector: 'ws-list-user',
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.scss'],
})
export class ListUserComponent implements OnInit {
  @ViewChild('searchPanel') searchPanel!: SearchPanelComponent

  users: IUserProfile[] = []
  usersCount = 0
  loading = false
  page = 0
  rowsPerPage = 10

  // Current search state
  searchType: SearchType = 'name'
  searchQuery = ''
  userStatus: UserStatus = 'active'
  selectedOrg: IOrganization | null = null
  hasSearched = false
  private readonly statusUpdateUserIds = new Set<string>()

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private usersService: UsersService,
    private readonly homeUsersService: HomeUsersService,
    private configSvc: ConfigurationsService,
  ) { }

  get canWrite(): boolean {
    const roles = this.configSvc.userRoles
    if (!roles) { return false }
    return roles.has('spv_admin') || roles.has('admin') || roles.has('state_admin')
  }

  get currentRootOrgId(): string {
    return (this.configSvc.userProfile as any)?.rootOrgId || ''
  }

  ngOnInit(): void {
    // Check for auto-search from navigation state
    const navState = history.state
    if (navState?.autoSearch && navState?.searchUserId) {
      this.searchType = navState.searchType || 'userId'
      this.searchQuery = navState.searchUserId
      setTimeout(() => {
        if (this.searchPanel) {
          this.searchPanel.setSearchParams(this.searchType, this.searchQuery)
        }
        this.hasSearched = true
        this.fetchUsers()
      })
    }
  }

  onSearch(params: ISearchParams): void {
    this.searchType = params.searchType
    this.searchQuery = params.searchQuery
    this.userStatus = params.userStatus
    this.selectedOrg = params.selectedOrg
    this.page = 0
    this.hasSearched = true
    this.fetchUsers()
  }

  onClear(): void {
    this.users = []
    this.usersCount = 0
    this.page = 0
    this.searchType = 'name'
    this.searchQuery = ''
    this.userStatus = 'active'
    this.selectedOrg = null
    this.hasSearched = false
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex
    this.rowsPerPage = event.pageSize
    this.fetchUsers()
  }

  fetchUsers(): void {
    this.loading = true

    const mapping = SEARCH_FIELD_MAPPINGS.find(m => m.type === this.searchType)
    const filters: { [key: string]: any } = {}

    // Root org filter — use selected org or fall back to current user's org
    if (this.selectedOrg) {
      filters['rootOrgId'] = this.selectedOrg.identifier || this.selectedOrg.orgId || this.selectedOrg.hashTagId
    } else {
      const currentOrgId = this.currentRootOrgId
      if (currentOrgId) {
        filters['profileDetails.ministryOrStateId'] = currentOrgId
      }
    }

    // Status filter
    if (this.userStatus === 'active') {
      filters['status'] = 1
    } else if (this.userStatus === 'inactive') {
      filters['status'] = 0
    }

    let freeTextQuery = ''

    if (this.searchQuery) {
      if (this.searchType === 'name') {
        freeTextQuery = this.searchQuery
      } else if (mapping) {
        if (this.searchType === 'roles') {
          filters[mapping.path] = [this.searchQuery]
        } else {
          filters[mapping.path] = this.searchQuery
        }
      }
    }

    const payload: any = {
      request: {
        fields: [],
        facets: ['rootChannel'],
        limit: this.rowsPerPage,
        filters,
        sort_by: { createdDate: 'desc' },
        offset: this.page * this.rowsPerPage,
        query: freeTextQuery || '',
      },
    }

    this.usersService.getUsers(payload).subscribe(
      (res: any) => {
        this.users = res?.result?.response?.content || []
        this.usersCount = res?.result?.response?.count || 0
        this.loading = false
      },
      (err: any) => {
        this.loading = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to fetch users', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onUserAction(event: { action: UserAction; user: IUserProfile }): void {
    switch (event.action) {
      case 'editDetails':
        this.openEditDetailsDialog(event.user)
        break
      case 'manageRoles':
        this.openRoleAssignmentDialog(event.user)
        break
      case 'resetPassword':
        this.openPasswordResetDialog(event.user)
        break
      case 'migrate':
        this.openMigrationDialog(event.user)
        break
      case 'reassign':
        this.openReassignDialog(event.user)
        break
      case 'activate':
        this.updateUserStatus(event.user, true)
        break
      case 'deactivate':
        this.updateUserStatus(event.user, false)
        break
    }
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '560px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) { this.refreshAfterDelay() }
    })
  }

  openHelpDialog(): void {
    this.dialog.open(HelpDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      autoFocus: false,
    })
  }

  private openEditDetailsDialog(user: IUserProfile): void {
    const dialogRef = this.dialog.open(EditUserDetailsDialogComponent, {
      width: '680px',
      maxHeight: '90vh',
      data: { user },
      autoFocus: false,
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) { this.refreshAfterDelay() }
    })
  }

  private openRoleAssignmentDialog(user: IUserProfile): void {
    const dialogRef = this.dialog.open(RoleAssignmentDialogComponent, {
      width: '560px',
      maxHeight: '90vh',
      data: { user },
      autoFocus: false,
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) { this.refreshAfterDelay() }
    })
  }

  private openPasswordResetDialog(user: IUserProfile): void {
    this.dialog.open(PasswordResetDialogComponent, {
      width: '520px',
      maxHeight: '90vh',
      data: { user },
      autoFocus: false,
    })
  }

  private openMigrationDialog(user: IUserProfile): void {
    const dialogRef = this.dialog.open(UserMigrationDialogComponent, {
      width: '520px',
      maxHeight: '90vh',
      data: { user },
      autoFocus: false,
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) { this.refreshAfterDelay() }
    })
  }

  private openReassignDialog(user: IUserProfile): void {
    const dialogRef = this.dialog.open(UserStatusUpdateDialogComponent, {
      width: '520px',
      maxHeight: '90vh',
      data: { user },
      autoFocus: false,
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) { this.refreshAfterDelay() }
    })
  }

  private updateUserStatus(user: IUserProfile, activate: boolean): void {
    if (this.statusUpdateUserIds.has(user.userId)) { return }

    const loggedInUserId = (this.configSvc.userProfile as any)?.userId ?? ''
    this.statusUpdateUserIds.add(user.userId)

    const request$ = activate
      ? this.homeUsersService.newUnBlockUserKong(loggedInUserId, user.userId)
      : this.homeUsersService.newBlockUserKong(loggedInUserId, user.userId)

    request$.subscribe(
      () => {
        this.statusUpdateUserIds.delete(user.userId)
        this.snackBar.open(`User ${activate ? 'activated' : 'deactivated'} successfully`, 'X', {
          duration: 5000,
          panelClass: ['success'],
        })
        this.refreshAfterDelay()
      },
      (err: any) => {
        this.statusUpdateUserIds.delete(user.userId)
        this.snackBar.open(
          err?.error?.params?.errmsg ?? `Failed to ${activate ? 'activate' : 'deactivate'} user`,
          'X',
          { duration: 5000, panelClass: ['error'] },
        )
      },
    )
  }

  /** Show loader immediately, wait 2 s for backend to index, then re-fetch */
  private refreshAfterDelay(delayMs = 2000): void {
    this.loading = true
    setTimeout(() => this.fetchUsers(), delayMs)
  }
}
