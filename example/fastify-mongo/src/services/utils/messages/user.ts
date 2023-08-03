const ErrorForUser = {
  NOT_FOUND: 'The requested user does not exists',
  NOTHING_TO_DELETE: 'There is no user to be deleted'
} as const

const MessageForUser = {
  ALL_USERS_DELETED: 'All the users were deleted successfully',
  USER_DELETED: 'The requested user was successfully deleted'
} as const

export { ErrorForUser as EFU, MessageForUser as MFU }
