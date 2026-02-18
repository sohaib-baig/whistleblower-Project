import type { IQuestion, IQuestionFormData } from 'src/types/question';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch questions from API
 */
export async function fetchQuestions(): Promise<any> {
  const response = await sanctum.get(endpoints.questions.list);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Fetch single question by ID
 */
export async function fetchQuestion(id: string): Promise<any> {
  const url =
    typeof endpoints.questions.details === 'function'
      ? endpoints.questions.details(id)
      : endpoints.questions.details;

  const response = await sanctum.get(url);
  return response.data;
}

/**
 * Create new question
 */
export async function createQuestion(data: IQuestionFormData): Promise<any> {
  await initSanctumCsrf();

  // Transform camelCase to snake_case for backend
  const payload = {
    name: data.name,
    is_required: data.isRequired,
    input_type: data.inputType,
    options: data.options,
  };

  const response = await sanctum.post(endpoints.questions.create, payload);
  return response.data;
}

/**
 * Update question
 */
export async function updateQuestion(id: string, data: Partial<IQuestionFormData>): Promise<any> {
  const url =
    typeof endpoints.questions.update === 'function'
      ? endpoints.questions.update(id)
      : endpoints.questions.update;

  await initSanctumCsrf();

  // Transform camelCase to snake_case for backend
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.isRequired !== undefined) payload.is_required = data.isRequired;
  if (data.inputType !== undefined) payload.input_type = data.inputType;
  if (data.options !== undefined) payload.options = data.options;

  const response = await sanctum.put(url, payload);
  return response.data;
}

/**
 * Delete question
 */
export async function deleteQuestion(id: string): Promise<void> {
  const url =
    typeof endpoints.questions.delete === 'function'
      ? endpoints.questions.delete(id)
      : endpoints.questions.delete;

  await initSanctumCsrf();
  await sanctum.delete(url);
}

/**
 * Reorder questions (drag and drop)
 */
export async function reorderQuestions(
  questions: Array<{ id: string; order: number }>
): Promise<void> {
  await initSanctumCsrf();
  await sanctum.post(endpoints.questions.reorder, { questions });
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch questions with loading state
 */
export function useGetQuestions() {
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchQuestions();

      // Transform backend data to match frontend IQuestion type
      const transformedData: IQuestion[] = data.map((question: any) => ({
        id: question.id.toString(),
        name: question.name,
        isRequired: question.is_required,
        inputType: question.input_type,
        options: question.options,
        order: question.order,
        createdAt: question.created_at,
        updatedAt: question.updated_at,
      }));

      // Sort by order
      transformedData.sort((a, b) => a.order - b.order);

      setQuestions(transformedData);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: loadQuestions,
  };
}

/**
 * Hook to fetch single question
 */
export function useGetQuestion(id: string) {
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestion() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchQuestion(id);

        // Transform backend data to match frontend IQuestion type
        const transformedData: IQuestion = {
          id: data.id.toString(),
          name: data.name,
          isRequired: data.is_required,
          inputType: data.input_type,
          options: data.options,
          order: data.order,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setQuestion(transformedData);
      } catch (err) {
        console.error('Failed to fetch question:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch question');
        setQuestion(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadQuestion();
    }
  }, [id]);

  return {
    question,
    loading,
    error,
  };
}
