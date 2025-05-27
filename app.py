from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv  # Add this import

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'your-api-key-here')
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')

def analyze_phobia(description):
    """Analyze the user's description to identify potential phobia"""
    
    prompt = f"""
    Based on the following description of someone's fear or anxiety, please analyze and provide:
    
    Description: "{description}"
    
    Please respond in JSON format with the following structure:
    {{
        "phobia_name": "Official name of the phobia (if identifiable)",
        "common_name": "Common/everyday name for this fear",
        "description": "Brief explanation of what this phobia involves",
        "severity_assessment": "mild/moderate/severe based on description",
        "symptoms": ["list", "of", "common", "symptoms"],
        "coping_strategies": ["list", "of", "practical", "coping", "methods"],
        "professional_help": "When to seek professional help",
        "helpful_resources": ["list", "of", "resource", "types"],
        "confidence": "How confident you are in this assessment (percentage)"
    }}
    
    If you cannot identify a specific phobia, still provide helpful general anxiety management advice in the same format.
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean the response text to extract JSON
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        # Parse JSON response
        result = json.loads(response_text)
        return result
        
    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        return {
            "phobia_name": "Unable to determine",
            "common_name": "General anxiety/fear",
            "description": "The description suggests anxiety or fear that may benefit from professional evaluation.",
            "severity_assessment": "Unknown",
            "symptoms": ["Anxiety", "Avoidance behavior", "Physical discomfort"],
            "coping_strategies": [
                "Deep breathing exercises",
                "Gradual exposure therapy",
                "Mindfulness meditation",
                "Regular exercise",
                "Seek professional help"
            ],
            "professional_help": "Consider consulting a mental health professional for proper evaluation and treatment.",
            "helpful_resources": [
                "Cognitive Behavioral Therapy (CBT)",
                "Support groups",
                "Self-help books on anxiety management",
                "Mental health apps"
            ],
            "confidence": "Low - automated analysis"
        }
    
    except Exception as e:
        print(f"Error analyzing phobia: {str(e)}")
        return {
            "error": "Unable to analyze the description. Please try again or consult a mental health professional."
        }

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze the phobia description"""
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        
        if not description:
            return jsonify({'error': 'Please provide a description of your fear or anxiety.'}), 400
        
        if len(description) < 10:
            return jsonify({'error': 'Please provide a more detailed description (at least 10 characters).'}), 400
        
        # Analyze the phobia
        result = analyze_phobia(description)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in analyze route: {str(e)}")
        return jsonify({'error': 'An error occurred while analyzing your description. Please try again.'}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    # Check if API key is set
    if GEMINI_API_KEY == 'your-api-key-here':
        print("Warning: Please set your GEMINI_API_KEY environment variable")
    
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))