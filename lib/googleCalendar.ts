// lib/googleCalendar.ts
// Google Calendar API wrapper — Custom Code (Anti-Pattern #3 준수)
// 서버사이드 API Route에서만 호출

import { google } from "googleapis";

interface InsertEventParams {
  accessToken: string;
  title: string;
  description: string;
  deadline: Date;
}

export async function insertCalendarEvent({
  accessToken,
  title,
  description,
  deadline,
}: InsertEventParams): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const endTime = new Date(deadline.getTime() + 60 * 60 * 1000); // +1시간

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `[CheatSheet] ${title}`,
      description,
      start: {
        dateTime: deadline.toISOString(),
        timeZone: "Asia/Seoul",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Asia/Seoul",
      },
      // 10분 전 알림
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 10 }],
      },
    },
  });

  if (!response.data.id) {
    throw new Error("Calendar event created but no ID returned");
  }

  return response.data.id;
}
