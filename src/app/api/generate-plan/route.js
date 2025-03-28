import OpenAI from 'openai'
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    const isReprompt = body.aiPlan !== null && body.aiPlan !== undefined;
    
    let prompt = `As an expert high school academic advisor, create a detailed course plan based on the following student information:
    
Current Status:
- Grade: ${body.studentInfo.currentGrade}
- Target College: ${body.collegeInfo?.collegeName || 'Not specified'}
- Intended Major: ${body.collegeInfo?.majorName || 'Not specified'}
- Course Load Preference: ${body.studentInfo.preferences.difficultyLevel}/10
- Prioritize College Credits: ${body.studentInfo.preferences.collegePriority}
- Allow Summer Courses: ${body.studentInfo.preferences.allowSummerCourses}

Already Completed:
${JSON.stringify(body.completedCourses, null, 2)}

AP Scores:
${JSON.stringify(body.apScores, null, 2)}

Dual Credits:
${JSON.stringify(body.dualCredits, null, 2)}
extra comments by student for you to consider and apply:
${JSON.stringify(body.extra, null, 2)}`;

    if (isReprompt) {
      prompt = `Use this as reference from the previous prompt and follow the reprompt:

Previous AI Plan:
${JSON.stringify(body.aiPlan, null, 2)}

Reprompt Information:
${body.repromptInfo || 'No specific reprompt information provided.'}

${prompt}`;
    }

    prompt += `
Please create a detailed semester-by-semester high school course plan following these STRICT requirements:

CORE PRINCIPLES:
1. ALWAYS recommend the most advanced version of a course available based on the student's difficulty preference
2. For difficulty 8+/10: ALL courses should be advanced level (Pre-AP/AP/IB/Dual Credit) when available
3. For difficulty 5-7/10: Mix advanced and regular courses based on student strengths
4. For difficulty <5/10: Regular courses with optional advanced courses in areas of strength

MATHEMATICS ACCELERATION RULES:
1. If student has completed Algebra 1:
   - 9th: Advanced Geometry AND Advanced Algebra 2 (concurrent)
   - 10th: Pre-Calculus (or summer between 9th-10th if allowed)
   - 11th: AP Calculus BC
   - 12th: Choose from: Calculus 3, Linear Algebra, Discrete Math (all require Calc BC)
2. If no Algebra 1:
   - 9th: Algebra 1
   - 10th: Advanced Geometry AND Advanced Algebra 2 (concurrent)
   - 11th: Pre-Calculus
   - 12th: AP Calculus BC


SOCIAL STUDIES SEQUENCE (for difficulty 6+/10):
1. Standard Advanced Path:
   - 9th: AP Human Geography
   - 10th: AP World History
   - 11th: AP US History
   - 12th: AP Government (semester) + AP Economics (semester)
2. Summer options if allowed:
   - Government/Economics can be taken summer before senior year
   - World History or US History may be available in summer

FRESHMAN YEAR RECOMMENDATIONS:
- AP Biology is available and recommended for difficulty 7+/10
- AP Computer Science Principles is available and recommended for difficulty 7+/10
- Pre-AP/Advanced versions of core classes are available and should be taken for difficulty 6+/10

COMPUTER SCIENCE PROGRESSION (if available):
1. Recommended sequence for difficulty 7+/10:
   - Year 1: AP CS Principles
   - Year 2: AP CS A
   - Year 3: Advanced CS 3/Data Structures
   - Year 4: Independent Study/Advanced CS 4

PREREQUISITES:
1. Math (STRICT):
   - Calculus BC requires Pre-Calculus
   - Linear Algebra requires Calculus BC completion
   - Discrete Math requires Calculus BC completion
   - Calculus 3 requires Calculus BC completion
2. Science:
   - Chemistry recommended before AP Biology
   - Physics 1(ap/onramps) recommended before AP Physics C
   - AP Computer Science A recommended after AP CS Principles

GRADUATION RULES:
- 1 credit = 2 semesters
- 0.5 credit = 1 semester
- Maximum 8 classes per semester
- Each semester needs 8 classes
- Summer courses only if explicitly allowed

Format the response as a JSON object with the following structure:
{
  "recommendations": {
    "Year X": {
      "fall": [{"course": "Course Name", "type": "Regular/Pre-AP/AP/Dual Credit", "credits": "0.5", "notes": "Required prerequisite/Recommended for major/etc"}],
      "spring": [...],
      "summer": [...]
    }
  },
  "summary": {
    "totalCredits": "X",
    "graduationStatus": "On track/Warning message",
    "recommendedPrep": "Additional recommendations(not extra cirriculars)",
    "recommendedExtracurriculars": "List of recommended activities that can help with major/career goals(SEPERATE IT ALL BY COMMAS AND SPACE OR ONLY DEATH AWAITS)(here are the list of options:3-Eyed Giant Media Studio, Academic Decathlon, African Education Drive (AED), Anti-Bullying Committee, Animal Science Club, Architecture Club, Asian Student Union, Auto Tech Skills USA, AVID Club, Ballet Folklorico, Band, Black Student Union, Book Club, Boys Volleyball Club, Build-A-Home, Carousel of Roses, Choir, College Ambassadors, Color Guard, Compelling Why, Cosmetology Club, Cricket Club, Cybersecurity Club, CRU, Daughters Of God, DECA, Desi Student Union (DSU), Desperados, Eagle Eye (Communications), Eagle Guard, Environmental Club, ESL Club, eSports, FCCLA (Hotel Management Club), Fashion Club, Film Association Meetings (FAM), French Club, Girl Up, Guitarists Guild, Haznos Valer, Hip Hop Crew, History Club, International Thespian Society, Japanese Club, Jesus Club, Jewish Student Union, JROTC, Jr. World Affairs Council, Latin Club, Math & Science Club, Medical Eagles / HOSA, Mock Trial, Mu Alpha Theta, Muslim Student Association, National Art Honor Society, National Honor Society, National Honor Society of Dance Arts, Orchestra, Peer Helpers, Peer Mediators, Robotics Club, SAGA Club, Seniors 2022, Spanish Club, Speech & Debate, Student Council, Student Equity Ambassadors, Students of East Africa (SEA), Step Team, Tabletop Club (Board Games), Talon (School Newspaper), Teens Offering Peer Support, Texas Assoc. of Future Educators, Theatre Production, Toys for Texans, UIL Academics, West African Student Union, Women s Club, 3-Eyed Giant Media Studio, Academic Decathlon, African Education Drive (AED), Anti-Bullying Committee, Animal Science Club, Architecture Club, Asian Student Union, Auto Tech Skills USA, AVID Club, Ballet Folklorico, Band, Black Student Union, Book Club, Boys Volleyball Club, Build-A-Home, Carousel of Roses, Choir, College Ambassadors, Color Guard, Compelling Why, Cosmetology Club, Cricket Club, Cybersecurity Club, CRU, Daughters Of God, DECA, Desi Student Union (DSU), Desperados, Eagle Eye (Communications), Eagle Guard, Environmental Club, ESL Club, eSports, FCCLA (Hotel Mangement Club), Fashion Club, Film Association Meetings (FAM), French Club, Girl Up, Guitarists Guild, Baseball, Boys Basketball, Boys Soccer, Boys Track, Cheer, Cross Country, Eaglettes, Football, Girls Basketball, Girls Soccer, Girls Track, Sports Medicine/Athletic Training, Softball, Swimming, Tennis, Volleyball, Wrestling)"
  }
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are an expert high school academic advisor. You MUST:
1. ALWAYS recommend AP/Advanced courses for students with difficulty preference 7+/10
2. NEVER recommend regular courses when advanced versions are available for high difficulty students
3. Check if student has completed Algebra 1 and accelerate math accordingly
4. Follow the standard AP social studies sequence for advanced students
5. Include computer science sequence when available
6. Follow ALL prerequisites exactly as specified
7. Prioritize accelerated math sequences for STEM majors
${isReprompt ? '8. Review the previous plan and make adjustments based on the reprompt information while maintaining continuity' : ''}` 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const planResponse = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json(planResponse);

  } catch (error) {
    console.error('Error generating course plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate course plan', details: error.message },
      { status: 500 }
    );
  }
}