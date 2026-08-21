interface LessonPlanParams {
  topic: string;
  strand: string;
  indicators: string;
  classId: string;
  subjectName: string;
}

export const generateLessonPlan = async (params: LessonPlanParams): Promise<{ content: string }> => {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

  // If API Key is present, make a request to Gemini API
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Act as a GES (Ghana Education Service) and NaCCA compliant teacher. 
                    Generate a structured lesson plan in HTML format (using ONLY <h4> and <p> elements) based on the following:
                    Subject: ${params.subjectName}
                    Class: ${params.classId}
                    Topic: ${params.topic}
                    Strand: ${params.strand}
                    Indicators: ${params.indicators}
                    
                    The lesson plan MUST include:
                    1. A 'Starter Activity' that engages students using a localized Ghanaian school context (e.g., using local names like Kojo, Ama, Yaw or local marketplaces like Makola or Kejetia).
                    2. 'Main Content' describing a step-by-step teaching methodology with interactive classroom exercises.
                    3. A 'Plenary' serving as a quick summary check or exit ticket.`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (content) {
        // Strip markdown codeblock backticks if Gemini returned them
        const cleaned = content.replace(/```html|```/gi, '').trim();
        return { content: cleaned };
      }
    } catch (e) {
      console.error('Failed querying Gemini API. Falling back to local NaCCA template engine.', e);
    }
  }

  // Local NaCCA Template Engine Fallback
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockContent = `
        <h4>Starter Activity</h4>
        <p>Introduce the lesson topic "<strong>${params.topic}</strong>" by engaging the class in a localized mental workout. 
        Ask students like Kojo and Ama to simulate a market bargaining scenario at Kejetia or Makola Market, relating it directly to ${params.strand}.</p>
        
        <h4>Main Content</h4>
        <p>Examine the indicator <strong>${params.indicators}</strong>. Write core notes on the board and guide the pupils through step-by-step interactive exercises. 
        Break the JHS class into small study circles of 5 to solve local word problem challenges mapped to the GES syllabus.</p>
        
        <h4>Plenary</h4>
        <p>Wrap up the session with an exit ticket. Ask pupils to write down one real-world application of ${params.topic} they observe in their local neighborhood on a slip of paper before going home.</p>
      `;
      resolve({ content: mockContent });
    }, 1500);
  });
};
