import { ConfigurationsService } from '@sunbird-cb/utils-v2'

import { IUserProfile } from '../../models/users.models'
import { UserActionsMenuComponent } from './user-actions-menu.component'

describe('UserActionsMenuComponent status actions', () => {
  let component: UserActionsMenuComponent

  const activeUser: IUserProfile = {
    userId: 'active-user',
    status: 1,
  }

  const inactiveUser: IUserProfile = {
    userId: 'inactive-user',
    status: 0,
  }

  beforeEach(() => {
    const configSvc = {
      userRoles: new Set(['spv_admin']),
    } as unknown as ConfigurationsService

    component = new UserActionsMenuComponent(configSvc)
  })

  it('exposes only the deactivate action state for an active user', () => {
    component.user = activeUser

    expect(component.isActive).toBe(true)
    expect(component.isInactive).toBe(false)
  })

  it('exposes only the activate action state for an inactive user', () => {
    component.user = inactiveUser

    expect(component.isActive).toBe(false)
    expect(component.isInactive).toBe(true)
  })

  it('emits deactivate with the selected active user', () => {
    component.user = activeUser
    const emitSpy = jest.spyOn(component.actionSelected, 'emit')

    component.onAction('deactivate')

    expect(emitSpy).toHaveBeenCalledWith({ action: 'deactivate', user: activeUser })
  })

  it('emits activate with the selected inactive user', () => {
    component.user = inactiveUser
    const emitSpy = jest.spyOn(component.actionSelected, 'emit')

    component.onAction('activate')

    expect(emitSpy).toHaveBeenCalledWith({ action: 'activate', user: inactiveUser })
  })
})
