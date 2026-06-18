import express, { Request } from 'express';

const router = express.Router();

const buildOpenApiSpec = (req: Request) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return {
    openapi: '3.0.3',
    info: {
      title: 'Job Prostuti API',
      version: '1.0.0',
      description:
        'Course categories, courses, syllabus, exams, MCQ questions, image questions, and exam result APIs.',
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Courses' },
      { name: 'Exams' },
      { name: 'Results' },
      { name: 'Admin Content' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'বিসিএস' },
            slug: { type: 'string', example: 'bcs' },
            icon: { type: 'string' },
            isActive: { type: 'boolean' },
            order: { type: 'number' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            categoryId: { type: 'string' },
            title: { type: 'string', example: 'সাপ্তাহিক পূর্ণাঙ্গ মডেল টেস্ট [ফ্রি]' },
            slug: { type: 'string', example: 'weekly-full-model-test-free' },
            description: { type: 'string' },
            thumbnailUrl: { type: 'string' },
            bannerUrl: { type: 'string' },
            status: { type: 'string', enum: ['running', 'upcoming', 'archived'] },
            durationLabel: { type: 'string' },
            totalExams: { type: 'number' },
            participantCount: { type: 'number' },
            isFree: { type: 'boolean' },
            price: { type: 'number' },
            tabs: {
              type: 'array',
              items: { type: 'string' },
            },
            isActive: { type: 'boolean' },
            order: { type: 'number' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string', example: "'ইয়েলটা কনফারেন্স' এর একটি লক্ষ্য ছিল -" },
            imageUrl: { type: 'string' },
            options: {
              type: 'object',
              properties: {
                A: { type: 'string' },
                B: { type: 'string' },
                C: { type: 'string' },
                D: { type: 'string' },
              },
            },
            optionImages: {
              type: 'object',
              properties: {
                A: { type: 'string' },
                B: { type: 'string' },
                C: { type: 'string' },
                D: { type: 'string' },
              },
            },
            subject: { type: 'string' },
            topic: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          },
        },
        Exam: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            courseId: { type: 'string' },
            title: { type: 'string', example: '২০০ মার্কের ফ্রি মডেল টেস্ট' },
            type: { type: 'string', enum: ['live', 'model', 'subject', 'weekly'] },
            subject: { type: 'string' },
            topic: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time' },
            durationMinutes: { type: 'number' },
            totalMarks: { type: 'number' },
            status: { type: 'string', enum: ['running', 'upcoming', 'archived'] },
            participantCount: { type: 'number' },
            isPublished: { type: 'boolean' },
          },
        },
        SubmitExamRequest: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Required when Authorization header is omitted.',
            },
            answers: {
              type: 'object',
              additionalProperties: {
                type: 'string',
                enum: ['A', 'B', 'C', 'D'],
              },
              example: {
                questionId1: 'A',
                questionId2: 'C',
              },
            },
          },
        },
        CategoryCreate: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'বিসিএস' },
            slug: { type: 'string', example: 'bcs' },
            icon: { type: 'string' },
            order: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: true },
          },
        },
        CourseCreate: {
          type: 'object',
          required: ['categoryId', 'title'],
          properties: {
            categoryId: { type: 'string' },
            title: { type: 'string', example: 'সাপ্তাহিক পূর্ণাঙ্গ মডেল টেস্ট [ফ্রি]' },
            slug: { type: 'string', example: 'weekly-full-model-test-free' },
            description: { type: 'string' },
            thumbnailUrl: { type: 'string' },
            bannerUrl: { type: 'string' },
            status: { type: 'string', enum: ['running', 'upcoming', 'archived'], example: 'running' },
            durationLabel: { type: 'string', example: 'প্রতি সপ্তাহ' },
            totalExams: { type: 'number', example: 52 },
            participantCount: { type: 'number', example: 0 },
            isFree: { type: 'boolean', example: true },
            price: { type: 'number', example: 0 },
            tabs: {
              type: 'array',
              items: { type: 'string' },
              example: ['exams', 'syllabus', 'notes', 'results'],
            },
            order: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: true },
          },
        },
        QuestionCreate: {
          type: 'object',
          required: ['text', 'options', 'correctOption'],
          properties: {
            text: { type: 'string' },
            imageUrl: { type: 'string' },
            options: {
              type: 'object',
              required: ['A', 'B', 'C', 'D'],
              properties: {
                A: { type: 'string' },
                B: { type: 'string' },
                C: { type: 'string' },
                D: { type: 'string' },
              },
            },
            optionImages: {
              type: 'object',
              properties: {
                A: { type: 'string' },
                B: { type: 'string' },
                C: { type: 'string' },
                D: { type: 'string' },
              },
            },
            correctOption: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
            explanation: { type: 'string' },
            subject: { type: 'string' },
            topic: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          },
        },
        NoteCreate: {
          type: 'object',
          required: ['title'],
          properties: {
            subject: { type: 'string' },
            topic: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            pdfUrl: { type: 'string' },
            videoUrl: { type: 'string' },
            type: { type: 'string', enum: ['lecture', 'note', 'reference'], example: 'note' },
            isPublished: { type: 'boolean', example: true },
          },
        },
        ExamCreate: {
          type: 'object',
          required: ['courseId', 'title', 'type', 'scheduledAt', 'durationMinutes', 'totalMarks'],
          properties: {
            courseId: { type: 'string' },
            title: { type: 'string' },
            type: { type: 'string', enum: ['live', 'model', 'subject', 'weekly'] },
            subject: { type: 'string' },
            topic: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time' },
            durationMinutes: { type: 'number' },
            totalMarks: { type: 'number' },
            questions: {
              type: 'array',
              items: { type: 'string' },
            },
            status: { type: 'string', enum: ['running', 'upcoming', 'archived'], example: 'running' },
            isPublished: { type: 'boolean', example: true },
          },
        },
      },
    },
    paths: {
      '/': {
        get: {
          tags: ['Health'],
          summary: 'API status',
          responses: { '200': { description: 'API is running' } },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check with DB status',
          responses: { '200': { description: 'Health status' } },
        },
      },
      '/api/admin/demo-login': {
        post: {
          tags: ['Auth'],
          summary: 'Get demo admin JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'admin@jobprostuti.com' },
                    password: { type: 'string', example: 'admin123' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Admin token' } },
        },
      },
      '/api/categories': {
        get: {
          tags: ['Courses'],
          summary: 'List categories',
          parameters: [
            {
              name: 'includeCourses',
              in: 'query',
              schema: { type: 'boolean' },
              example: true,
            },
          ],
          responses: { '200': { description: 'Categories and optional courses' } },
        },
      },
      '/api/categories/{slug}/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List courses by category slug',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'bcs' },
          ],
          responses: { '200': { description: 'Category courses' } },
        },
      },
      '/api/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List courses',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['running', 'upcoming', 'archived'] } },
            { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Courses' } },
        },
      },
      '/api/courses/{slug}': {
        get: {
          tags: ['Courses'],
          summary: 'Course details',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'weekly-full-model-test-free',
            },
          ],
          responses: { '200': { description: 'Course details' } },
        },
      },
      '/api/courses/{slug}/syllabus': {
        get: {
          tags: ['Courses'],
          summary: 'Course syllabus grouped by subject',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'bcs-preparation-6-months' },
          ],
          responses: { '200': { description: 'Syllabus' } },
        },
      },
      '/api/courses/{slug}/exams': {
        get: {
          tags: ['Exams'],
          summary: 'Published exams by course',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'weekly-full-model-test-free' },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['live', 'model', 'subject', 'weekly'] } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['running', 'upcoming', 'archived'] } },
          ],
          responses: { '200': { description: 'Exams' } },
        },
      },
      '/api/exams/{id}': {
        get: {
          tags: ['Exams'],
          summary: 'Exam details with public questions',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Exam and questions' } },
        },
      },
      '/api/exams/{id}/submit': {
        post: {
          tags: ['Exams'],
          summary: 'Submit exam answers and create result',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SubmitExamRequest' },
              },
            },
          },
          responses: { '201': { description: 'Exam result' } },
        },
      },
      '/api/results/{id}': {
        get: {
          tags: ['Results'],
          summary: 'Get one result',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Result' } },
        },
      },
      '/api/exams/{id}/leaderboard': {
        get: {
          tags: ['Results'],
          summary: 'Exam leaderboard',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'number' }, example: 20 },
          ],
          responses: { '200': { description: 'Leaderboard' } },
        },
      },
      '/api/admin/content/categories': {
        post: {
          tags: ['Admin Content'],
          summary: 'Create category',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryCreate' } } },
          },
          responses: { '201': { description: 'Created category' } },
        },
      },
      '/api/admin/content/courses': {
        post: {
          tags: ['Admin Content'],
          summary: 'Create course',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CourseCreate' } } },
          },
          responses: { '201': { description: 'Created course' } },
        },
      },
      '/api/admin/content/questions': {
        post: {
          tags: ['Admin Content'],
          summary: 'Create MCQ question',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/QuestionCreate' } } },
          },
          responses: { '201': { description: 'Created question' } },
        },
      },
      '/api/admin/content/courses/{courseId}/notes': {
        post: {
          tags: ['Admin Content'],
          summary: 'Create syllabus/note item',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteCreate' } } },
          },
          responses: { '201': { description: 'Created note' } },
        },
      },
      '/api/admin/content/exams': {
        post: {
          tags: ['Admin Content'],
          summary: 'Create exam',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ExamCreate' } } },
          },
          responses: { '201': { description: 'Created exam' } },
        },
      },
    },
  };
};

router.get('/api-docs.json', (req, res) => {
  res.json(buildOpenApiSpec(req));
});

router.get('/api-docs', (req, res) => {
  res.type('html').send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Job Prostuti API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f8fafc; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`);
});

export default router;
