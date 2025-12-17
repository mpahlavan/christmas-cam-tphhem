
import { useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

export type ChristmasTransformParams = {
  imageUri: string;
  imageBase64: string;
  filters: string[];
  prompt?: string;
};

export type ChristmasTransformResult = {
  url: string;
  path: string;
  duration_ms: number;
  taskId?: string;
  modelUrl?: string;
  texturedModelUrl?: string;
};

type State =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: ChristmasTransformResult; error: null }
  | { status: 'error'; data: null; error: string };

export function useChristmasTransform() {
  const [state, setState] = useState<State>({
    status: 'idle',
    data: null,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  const transform = useCallback(
    async (
      params: ChristmasTransformParams
    ): Promise<ChristmasTransformResult | null> => {
      if (!params.imageBase64) {
        setState({
          status: 'error',
          data: null,
          error: 'Image data is required',
        });
        return null;
      }

      if (!params.filters || params.filters.length === 0) {
        setState({
          status: 'error',
          data: null,
          error: 'Please select at least one Christmas filter',
        });
        return null;
      }

      setState({ status: 'loading', data: null, error: null });

      try {
        console.log('Calling christmas-transform function with filters:', params.filters);

        const { data, error } = await supabase.functions.invoke(
          'christmas-transform',
          {
            body: {
              imageBase64: params.imageBase64,
              filters: params.filters,
              prompt: params.prompt,
            },
          }
        );

        if (error) {
          console.error('Transform error:', error);
          const message = error.message || 'Failed to transform image';
          throw new Error(message);
        }

        console.log('Transform successful:', data);
        const result = data as ChristmasTransformResult;
        setState({ status: 'success', data: result, error: null });
        return result;
      } catch (err: any) {
        console.error('Transform exception:', err);
        const message = err?.message ?? 'Unknown error occurred';
        setState({ status: 'error', data: null, error: message });
        return null;
      }
    },
    []
  );

  const loading = state.status === 'loading';
  const error = state.status === 'error' ? state.error : null;
  const data = state.status === 'success' ? state.data : null;

  return { transform, loading, error, data, reset };
}
