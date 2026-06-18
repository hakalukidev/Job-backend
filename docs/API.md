# Job Prostuti API

Base URL for local development:

```text
http://localhost:5000
```

Swagger UI:

```text
http://localhost:5000/api-docs
```

OpenAPI JSON:

```text
http://localhost:5000/api-docs.json
```

All successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Health

`GET /` returns API status.

`GET /health` returns API and MongoDB connection status.

## Auth

`POST /api/auth/google`

Body:

```json
{
  "email": "user@gmail.com",
  "name": "User Name",
  "photoUrl": "https://example.com/photo.jpg",
  "idToken": "google-id-token"
}
```

`GET /api/auth/profile`

Requires `Authorization: Bearer <token>`.

`POST /api/admin/demo-login`

Body:

```json
{
  "email": "admin@jobprostuti.com",
  "password": "admin123"
}
```

## Mobile Content APIs

`GET /api/categories`

Returns active course categories. Use `?includeCourses=true` to include active courses inside each category.

`GET /api/categories/:slug/courses`

Returns one category and all active courses inside it.

Example:

```http
GET /api/categories/bcs/courses
```

`GET /api/courses`

Returns active courses. Optional query: `categoryId`, `status=running|upcoming|archived`.

`GET /api/courses/:slug`

Returns a course detail object with category info.

`GET /api/courses/:slug/syllabus`

Returns syllabus/notes grouped by subject.

`GET /api/courses/:slug/exams`

Returns published exams for a course. Optional query: `type=live|model|subject|weekly`, `status=running|upcoming|archived`.

`GET /api/exams/:id`

Returns exam details and public questions. Correct answers are hidden here.

Question shape:

```json
{
  "id": "questionId",
  "text": "Question text",
  "imageUrl": "https://example.com/question.png",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  },
  "optionImages": {
    "A": "https://example.com/a.png"
  },
  "subject": "বাংলাদেশ বিষয়াবলি",
  "topic": "সংবিধান",
  "difficulty": "easy"
}
```

`POST /api/exams/:id/submit`

Submits answers and creates an exam result. Use either a Bearer token or pass `userId` in the body.

Body:

```json
{
  "answers": {
    "questionId1": "A",
    "questionId2": "C"
  }
}
```

Response includes `result`, `summary`, and reviewed `questions` with `correctOption`, `selectedOption`, `isCorrect`, and `explanation`.

`GET /api/results/:id`

Returns one saved exam result.

`GET /api/exams/:id/leaderboard`

Returns ranked results for an exam. Optional query: `limit=20`.

## Admin Content APIs

All routes below require `Authorization: Bearer <admin-token>`. Get a token from `POST /api/admin/demo-login`.

`POST /api/admin/content/categories`

Create a dynamic category.

```json
{
  "name": "বিসিএস",
  "slug": "bcs",
  "icon": "https://example.com/icon.png",
  "order": 1,
  "isActive": true
}
```

`PUT /api/admin/content/categories/:id`

Update a category.

`POST /api/admin/content/courses`

Create a course under a category.

```json
{
  "categoryId": "categoryId",
  "title": "সাপ্তাহিক পূর্ণাঙ্গ মডেল টেস্ট [ফ্রি]",
  "slug": "weekly-full-model-test-free",
  "description": "প্রতি শনিবার ফ্রি মডেল টেস্ট।",
  "thumbnailUrl": "https://example.com/card.png",
  "bannerUrl": "https://example.com/banner.png",
  "status": "running",
  "durationLabel": "প্রতি সপ্তাহ",
  "totalExams": 52,
  "participantCount": 0,
  "isFree": true,
  "price": 0,
  "tabs": ["exams", "syllabus", "notes", "results"],
  "order": 1,
  "isActive": true
}
```

`PUT /api/admin/content/courses/:id`

Update a course.

`POST /api/admin/content/questions`

Create an MCQ question. Supports image question and image options.

```json
{
  "text": "Question text",
  "imageUrl": "https://example.com/question.png",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  },
  "optionImages": {
    "A": "https://example.com/a.png",
    "B": "https://example.com/b.png"
  },
  "correctOption": "A",
  "explanation": "Why A is correct.",
  "subject": "আন্তর্জাতিক বিষয়াবলি",
  "topic": "সংগঠন",
  "difficulty": "medium"
}
```

`POST /api/admin/content/courses/:courseId/notes`

Create a syllabus/note item.

```json
{
  "subject": "বাংলাদেশ বিষয়াবলি",
  "topic": "সংবিধান",
  "title": "সংবিধান পরিচিতি",
  "content": "Readable note content",
  "pdfUrl": "https://example.com/file.pdf",
  "videoUrl": "https://example.com/video",
  "type": "note",
  "isPublished": true
}
```

`POST /api/admin/content/exams`

Create an exam and attach MCQ questions.

```json
{
  "courseId": "courseId",
  "title": "২০০ মার্কের ফ্রি মডেল টেস্ট",
  "type": "weekly",
  "subject": "Full Syllabus",
  "topic": "Model Test",
  "scheduledAt": "2026-06-18T00:00:00.000Z",
  "durationMinutes": 100,
  "totalMarks": 200,
  "questions": ["questionId1", "questionId2"],
  "status": "running",
  "isPublished": true
}
```

`PUT /api/admin/content/exams/:id`

Update an exam.
