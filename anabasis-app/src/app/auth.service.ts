import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionUser, UserAccount } from './models';

const USERS_KEY = 'anabasis_users';
const SESSION_KEY = 'anabasis_session_user';

function randomId(prefix: string): string {
  const raw = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${raw}`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<SessionUser | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();

  get currentUser(): SessionUser | null {
    return this.sessionSubject.value;
  }

  register(email: string, password: string): { ok: boolean; message: string } {
    const users = this.readUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      return { ok: false, message: 'Email and password are required.' };
    }

    if (users.some((u) => u.email === normalizedEmail)) {
      return { ok: false, message: 'Email already registered.' };
    }

    const newUser: UserAccount = {
      id: randomId('user'),
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const session: SessionUser = { id: newUser.id, email: newUser.email };
    this.setSession(session);
    return { ok: true, message: 'Account created successfully.' };
  }

  login(email: string, password: string): { ok: boolean; message: string } {
    const users = this.readUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const matched = users.find((u) => u.email === normalizedEmail && u.password === password);

    if (!matched) {
      return { ok: false, message: 'Invalid email or password.' };
    }

    this.setSession({ id: matched.id, email: matched.email });
    return { ok: true, message: 'Logged in.' };
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.sessionSubject.next(null);
  }

  private setSession(user: SessionUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.sessionSubject.next(user);
  }

  private readUsers(): UserAccount[] {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as UserAccount[]) : [];
  }

  private readSession(): SessionUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  }
}
