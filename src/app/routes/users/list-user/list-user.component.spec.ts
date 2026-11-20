import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { of, Subject, throwError } from 'rxjs'

import { UsersService as HomeUsersService } from '@ws/app/src/lib/routes/home/services/users.service'
import { IUserProfile } from '../models/users.models'
import { UsersService } from '../users.service'
import { ListUserComponent } from './list-user.component'

describe('ListUserComponent status actions', () => {
  let component: ListUserComponent
  let snackBar: { open: jest.Mock }
  let homeUsersService: {
    newBlockUserKong: jest.Mock
    newUnBlockUserKong: jest.Mock
  }

  const activeUser: IUserProfile = {
    userId: 'active-user',
    status: 1,
  }

  const inactiveUser: IUserProfile = {
    userId: 'inactive-user',
    status: 0,
  }

  beforeEach(() => {
    snackBar = { open: jest.fn() }
    homeUsersService = {
      newBlockUserKong: jest.fn(),
      newUnBlockUserKong: jest.fn(),
    }

    component = new ListUserComponent(
      { open: jest.fn() } as unknown as MatDialog,
      snackBar as unknown as MatSnackBar,
      { getUsers: jest.fn() } as unknown as UsersService,
      homeUsersService as unknown as HomeUsersService,
      {
        userProfile: { userId: 'logged-in-user' },
        userRoles: new Set(['spv_admin']),
      } as unknown as ConfigurationsService,
    )
  })

  it('calls the unblock API with the logged-in and selected inactive user IDs', () => {
    homeUsersService.newUnBlockUserKong.mockReturnValue(of({}))
    const refreshSpy = jest.spyOn(component as any, 'refreshAfterDelay').mockImplementation()

    component.onUserAction({ action: 'activate', user: inactiveUser })

    expect(homeUsersService.newUnBlockUserKong).toHaveBeenCalledWith('logged-in-user', 'inactive-user')
    expect(homeUsersService.newBlockUserKong).not.toHaveBeenCalled()
    expect(snackBar.open).toHaveBeenCalledWith('User activated successfully', 'X', {
      duration: 5000,
      panelClass: ['success'],
    })
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })

  it('calls the block API with the logged-in and selected active user IDs', () => {
    homeUsersService.newBlockUserKong.mockReturnValue(of({}))
    const refreshSpy = jest.spyOn(component as any, 'refreshAfterDelay').mockImplementation()

    component.onUserAction({ action: 'deactivate', user: activeUser })

    expect(homeUsersService.newBlockUserKong).toHaveBeenCalledWith('logged-in-user', 'active-user')
    expect(homeUsersService.newUnBlockUserKong).not.toHaveBeenCalled()
    expect(snackBar.open).toHaveBeenCalledWith('User deactivated successfully', 'X', {
      duration: 5000,
      panelClass: ['success'],
    })
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })

  it('does not refresh on failure and allows the action to be retried', () => {
    homeUsersService.newBlockUserKong
      .mockReturnValueOnce(throwError({ error: { params: { errmsg: 'Unable to deactivate' } } }))
      .mockReturnValueOnce(of({}))
    const refreshSpy = jest.spyOn(component as any, 'refreshAfterDelay').mockImplementation()

    component.onUserAction({ action: 'deactivate', user: activeUser })

    expect(snackBar.open).toHaveBeenCalledWith('Unable to deactivate', 'X', {
      duration: 5000,
      panelClass: ['error'],
    })
    expect(refreshSpy).not.toHaveBeenCalled()

    component.onUserAction({ action: 'deactivate', user: activeUser })

    expect(homeUsersService.newBlockUserKong).toHaveBeenCalledTimes(2)
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate submissions while a status request is pending', () => {
    const request$ = new Subject<any>()
    homeUsersService.newUnBlockUserKong.mockReturnValue(request$)
    jest.spyOn(component as any, 'refreshAfterDelay').mockImplementation()

    component.onUserAction({ action: 'activate', user: inactiveUser })
    component.onUserAction({ action: 'activate', user: inactiveUser })

    expect(homeUsersService.newUnBlockUserKong).toHaveBeenCalledTimes(1)

    request$.next({})
    request$.complete()
    component.onUserAction({ action: 'activate', user: inactiveUser })

    expect(homeUsersService.newUnBlockUserKong).toHaveBeenCalledTimes(2)
  })
})
