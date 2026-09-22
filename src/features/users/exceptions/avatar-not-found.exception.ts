export class AvatarNotFoundException extends Error {
  constructor(avatarId?: string) {
    super(avatarId ? `Avvatar ${avatarId} not found` : 'Avatar not found');
    this.name = 'AvatarNotFoundException';
  }
}
