@Info.md

Role & Operating Scope:
You are strictly an expert Client-Side Frontend Engineer working inside `/client` (Vite + React + TypeScript + Tailwind CSS + shadcn/ui).
Phase 1 (Redux, Cookie-based Auth, Landing, and Auth pages) is complete and fully functional. 

Phase 2 Objective: 
Build the Multi-Step Onboarding Flow. Do NOT build the final user dashboards yet (keep `/dashboard` as a placeholder route).

Architecture Rules:
1. Continue using the existing Redux setup (`authSlice`) and shadcn/ui components.
2. If new shadcn components are needed (e.g., Select, Accordion, Checkbox), install and configure them.
3. API Contracts: Write all `fetch` calls directly inside the consuming components with `credentials: "include"`, preceded by the standard JSDoc block.

Phase 2 UI Flow to Implement:

1. Screen A: Account Type Selector (`src/pages/onboarding/SelectAccountType.tsx`):
   - A clean layout presenting two large, clickable cards:
     1. "Individual" (Subtext: Students & Faculty)
     2. "Organization" (Subtext: Institutions & Industry)
   - Clicking an option stores the selection in local state and navigates to the respective next step.

2. Screen B: Individual Onboarding (`src/pages/onboarding/IndividualOnboarding.tsx`):
   - Profile Image upload preview circle.
   - Full Name input (required).
   - Role Selector toggle/tabs: "Student" or "Faculty".
   - Institution Email input & Institution Name dropdown selector.
   - "Verify Email" button triggering a mock OTP flow. Once verified, display a green checkmark badge (like LinkedIn).
   - Accordion / Collapsible section labeled "Optional Data (Too much to fill at start)":
     - Education: Degree/Course, Timeline, Description, "+ Add Education" button.
     - Past Experience: Title, Timeline, Description, Image Upload.
     - Certifications: Upload certificate file, Title, Description.
     - Skills tag selector (allow typing a skill and pressing enter to add as a badge).
   - "Submit / Complete Onboarding" button at the bottom.

3. Screen C: Organization Onboarding (`src/pages/onboarding/OrganizationOnboarding.tsx`):
   - Organization Type toggle/tabs: "Institution" or "Industry".
   - If Institution:
     - Institution Name input (dropdown with "AISHE database reference" subtext).
     - Official institutional domain email selector/crawler dropdown.
     - "Send OTP" button & read-only OTP verification badge.
     - Location dropdown.
   - If Industry:
     - Industry Type & Company Name inputs.
     - Official Website URL input.
     - Work Email with "Send OTP" / OTP verification flow.
     - Company Location & Employee size bracket dropdown.
   - "Submit / Complete Onboarding" button at the bottom.

4. Onboarding Submission Contract:
   - When the user clicks "Complete Onboarding" on either Screen B or C, write a `submitOnboarding` fetch function.
   - For now, if the backend route doesn't fully exist for onboarding details, mock a successful response `Promise.resolve({ success: true })`.
   - On success, dispatch an action to update Redux `user.isOnboarded = true`, and navigate the user to `/dashboard`.

Ensure strict TypeScript (no `any`), full loading/error states for submissions, and pixel-accurate alignment with the Excalidraw design. Proceed with generating Phase 2.
Generate the complete code for Phase 1 now.





addd remember meee
AI hai bro 
sgin up me vefiry otp ka page
UseNavigation use krna signup pr aur jo email ko navigate krke state me bhejoge verifyotp pr usko readOnly pr rkhna

remove SIH

26044 Project

100%

Cookie-based Security




I think you should make four separate pages 4 1 to manage 4 differ Types like  one for individual one for organisation one for faculty one for Institution As listed in Platform spec You will need To have Them to manage their self And their rules And what do you want to do You need to assign Everyone Their rule and load them according to that Think about it yourself and implement it See contour axle draw for More ideas and I think now you can Add some things on the server side back end


What I think you should do also is You are hard coding everything into the front end right now so you are now fully accessed to use the back end Now make the back end as good as you want cause you have to do everything right now front and back end and everything so you can make everything that you need according To our vision that we have to make like Explained in the Excel draw info read all of the documents md files To get a clear and better understanding And make everything So at everything would work reliably do not crashes Ask me if you need any kind of api keys I will update those And I was thinking about implementing Lang Chain As we need to it to be there As in the help board If the help what we are thinking of using Grock api keys So I think length chain will be needed in typescript version I think also have langchain So do everything and please don't **** anything Update course it has to be a working website which contain Opportunities created by the industry Maintain by the By the institution The role of the faculties also mentioned there you can see that and the student who will be Getting the benefit from all of these Think about it and first give me an implementation file What you are thinking of