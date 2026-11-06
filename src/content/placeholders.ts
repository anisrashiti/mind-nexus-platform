/** All client approvals live here; presentation strings remain in messages/en.json. */
export const placeholders = {
  // TODO(content): Confirm the real organization and HR contact before launch.
  organization: {name: 'Dardania Group', hrName: 'Drita Morina', hrEmail: 'drita.morina@example.com'},
  // TODO(content): Luljeta must approve the bio and real weekly hours.
  bioMessageKey: 'profile.bio',
  weeklyHours: [[1,'09:00','12:00'],[1,'13:00','17:00'],[2,'09:00','12:00'],[3,'09:00','12:00'],[3,'13:00','17:00'],[4,'10:00','18:00'],[5,'09:00','14:00']] as const,
  // TODO(content): Replace with clinician-reviewed consent, terms and privacy text; block production booking/invite acceptance until approved.
  consentVersion: 'draft-v1',
  consentApproved: false,
  legalApproved: false,
  // TODO(content): Confirm optional portrait; use the specified initials until supplied.
  photoUrl: null,
  // TODO(question): Client to confirm 0 or 10 minutes after scheduled end.
  joinGraceAfterEndMin: 0,
};
