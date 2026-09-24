// Verified by Priya (User B)
// UserModel.js - Database Data Model
export class UserModel {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    return this.db.users.findOne({ email });
  }

  async verifyPassword(email, candidatePassword) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return user.passwordHash === candidatePassword;
  }
}
