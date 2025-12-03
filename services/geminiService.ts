import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSignal = async (description: string): Promise<number[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere um sinal discreto (array de números) baseado nesta descrição: "${description}".
      O sinal deve ser curto, idealmente entre 5 e 15 amostras para visualização didática.
      Mantenha os valores numa escala razoável (ex: -5 a 5).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: "Array of signal samples"
        }
      }
    });

    const text = response.text;
    if (!text) return [1, 0, 0];
    const signal = JSON.parse(text);
    return Array.isArray(signal) ? signal : [1, 0, 0];
  } catch (error) {
    console.error("Failed to generate signal:", error);
    return [1, 1, 1, 1, 1]; // Fallback
  }
};

export const explainStep = async (x: number[], h: number[], n: number, yVal: number): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Explique brevemente o passo n=${n} da convolução discreta.
            Sinal x: [${x.join(', ')}].
            Resposta ao impulso h: [${h.join(', ')}].
            Neste passo, estamos calculando y[${n}].
            O resultado da soma é ${yVal}.
            A visualização mostra o sinal x[n-k] (invertido e deslocado) se movendo sobre o sinal h[k] (fixo).
            Explique intuitivamente como ocorre essa sobreposição. Responda em Português do Brasil.`,
            config: {
                maxOutputTokens: 150,
            }
        });
        return response.text || "Não foi possível gerar a explicação.";
    } catch (error) {
        console.error("Failed to explain:", error);
        return "Erro ao conectar com a IA.";
    }
}