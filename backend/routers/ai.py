from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/ai", tags=["ai"])

class DiagramRequest(BaseModel):
    prompt: str

class DiagramResponse(BaseModel):
    mermaid_code: str

@router.post("/diagram", response_model=DiagramResponse)
async def generate_diagram(request: DiagramRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": f"""Generate a Mermaid diagram for: {request.prompt}
                    Rules:
                    - Return ONLY raw Mermaid syntax, nothing else
                    - No markdown fences, no backticks, no explanation
                    - Use ONLY standard arrow syntax: --> or -->|label|
                    - Do NOT use >| or |> or any other arrow variants
                    - Keep labels short and simple, no special characters
                    - Start directly with the diagram type e.g. flowchart TD

                    Example of correct syntax:
                    flowchart TD
                        A[Start] -->|Login| B{{Check Credentials}}
                        B -->|Valid| C[Dashboard]
                        B -->|Invalid| A"""
            }
        ],
        max_tokens=1024,
    )

    mermaid_code = completion.choices[0].message.content.strip()
    return DiagramResponse(mermaid_code=mermaid_code)