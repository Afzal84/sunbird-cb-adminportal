import { Component, EventEmitter, Input, Output } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { IUserProfile } from '../../models/users.models'

export type UserAction = 'editDetails' | 'manageRoles' | 'resetPassword' | 'migrate' | 'reassign' | 'activate' | 'deactivate'

@Component({
  standalone: false,
  selector: 'ws-user-actions-menu',
  templateUrl: './user-actions-menu.component.html',
  styleUrls: ['./user-actions-menu.component.scss'],
})
export class UserActionsMenuComponent {
  @Input() user!: IUserProfile
  @Output() actionSelected = new EventEmitter<{ action: UserAction; user: IUserProfile }>()

  constructor(private configSvc: ConfigurationsService) { }

  get canWrite(): boolean {
    const roles = this.configSvc.userRoles
    if (!roles) { return false }
    return roles.has('spv_admin') || roles.has('admin') || roles.has('state_admin')
  }

  get isNotDeleted(): boolean {
    return this.user.status !== 0
  }

  get isNotMyUser(): boolean {
    return this.user.profileDetails?.profileStatus === 'NOT-MY-USER'
  }

  get isActive(): boolean {
    return this.user.status === 1
  }

  get isInactive(): boolean {
    return this.user.status === 0
  }

  onAction(action: UserAction): void {
    this.actionSelected.emit({ action, user: this.user })
  }
}
