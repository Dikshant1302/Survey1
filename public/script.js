// Add these functions at the top of the file
window.submittedSurveys = window.submittedSurveys || new Set()
let currentDepartment = null
let currentTenure = null
let isAdmin = false
let currentUser = null
let sessionTimeout

// Declare necessary variables
const DEPARTMENTS = [
  { value: "HR", label: "Human Resources" },
  { value: "IT", label: "Information Technology" },
  { value: "Finance", label: "Finance" },
  // Add more departments as needed
]

// Add the missing exportResponses function
window.exportResponses = async () => {
  try {
    const response = await fetch("/api/responses/export")

    if (!response.ok) {
      throw new Error("Failed to export responses")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = "survey_responses.csv"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    alert("Responses exported successfully!")
  } catch (error) {
    console.error("Export error:", error)
    alert("Failed to export responses: " + error.message)
  }
}

// Add the missing generateAnalysis function
window.generateAnalysis = async (event) => {
  let originalText
  try {
    // Show loading message
    originalText = event.target.textContent
    event.target.textContent = "Generating..."
    event.target.disabled = true

    const response = await fetch("/api/responses/analysis")

    if (!response.ok) {
      throw new Error("Failed to generate analysis")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = "survey_analysis.pdf"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    alert("Analysis generated and downloaded successfully!")
  } catch (error) {
    console.error("Analysis generation error:", error)
    alert("Failed to generate analysis: " + error.message)
  } finally {
    // Reset button
    event.target.textContent = originalText
    event.target.disabled = false
  }
}

// Add the new functions for the simplified user flow
window.startSurvey = () => {
  const department = document.getElementById("department").value
  const tenure = document.getElementById("tenure").value

  if (!department || !tenure) {
    alert("Please select both Department and Tenure")
    return
  }

  // Store the user info
  currentDepartment = department
  currentTenure = tenure

  // Store in localStorage to persist between page refreshes
  localStorage.setItem("surveyDepartment", department)
  localStorage.setItem("surveyTenure", tenure)

  // Hide the user info form and show the employee panel
  document.getElementById("user-info-container").classList.add("hidden")
  document.getElementById("employee-panel").classList.remove("hidden")

  // Load available surveys for the selected department
  loadAvailableSurveys()
}

window.showAdminLogin = () => {
  document.getElementById("user-info-container").classList.add("hidden")
  document.getElementById("admin-login-container").classList.remove("hidden")
}

window.showUserForm = () => {
  document.getElementById("admin-login-container").classList.add("hidden")
  document.getElementById("user-info-container").classList.remove("hidden")
}

window.adminLogin = async () => {
  const username = document.getElementById("admin-username").value.trim()
  const password = document.getElementById("admin-password").value

  if (username !== "admin") {
    alert("Invalid admin credentials")
    return
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    })

    const data = await response.json()

    if (response.ok && data.user.role === "admin") {
      isAdmin = true
      localStorage.setItem("isAdmin", "true")

      // Show admin panel and logout button
      document.getElementById("admin-login-container").classList.add("hidden")
      document.getElementById("admin-panel").classList.remove("hidden")
      document.getElementById("admin-logout").classList.remove("hidden")

      await loadDepartmentSurveys()
    } else {
      alert("Invalid admin credentials")
    }
  } catch (error) {
    console.error("Admin login error:", error)
    alert("Login failed: " + error.message)
  }
}

window.adminLogout = () => {
  isAdmin = false
  localStorage.removeItem("isAdmin")

  // Hide admin panel and logout button
  document.getElementById("admin-panel").classList.add("hidden")
  document.getElementById("admin-logout").classList.add("hidden")

  // Show user form
  document.getElementById("user-info-container").classList.remove("hidden")

  // Clear admin login fields
  document.getElementById("admin-username").value = ""
  document.getElementById("admin-password").value = ""
}

// Initialize submittedSurveys on window object to ensure global access
window.submittedSurveys = window.submittedSurveys || new Set()

// Add this function near the top of your script file
window.togglePassword = (inputId) => {
  const input = document.getElementById(inputId)
  const button = input.nextElementSibling
  const icon = button.querySelector("i")

  if (input.type === "password") {
    input.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}

// Replace the checkLoginState function with this improved version
function checkLoginState() {
  // Check if user is admin
  if (localStorage.getItem("isAdmin") === "true") {
    isAdmin = true
    document.getElementById("user-info-container").classList.add("hidden")
    document.getElementById("admin-panel").classList.remove("hidden")
    document.getElementById("admin-logout").classList.remove("hidden")
    loadDepartmentSurveys()
    return true
  }

  // Check if user has department and tenure stored
  const department = localStorage.getItem("surveyDepartment")
  const tenure = localStorage.getItem("surveyTenure")

  if (department && tenure) {
    currentDepartment = department
    currentTenure = tenure
    document.getElementById("user-info-container").classList.add("hidden")
    document.getElementById("employee-panel").classList.remove("hidden")
    loadAvailableSurveys()
    return true
  }

  // Otherwise show the user info form
  document.getElementById("user-info-container").classList.remove("hidden")
  return false
}

// Session management
function startSession() {
  clearSession()
  sessionTimeout = setTimeout(
    () => {
      logout()
    },
    30 * 60 * 1000,
  ) // 30 minutes
}

function clearSession() {
  if (sessionTimeout) {
    clearTimeout(sessionTimeout)
  }
}

// Password validation
function validatePassword(password) {
  const minLength = 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*]/.test(password)

  return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial
}

// Add these new functions
function validateEmail(email) {
  // More permissive regex that allows various email formats
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(email)
}

window.verifyEmail = async () => {
  const email = sessionStorage.getItem("pendingVerificationEmail")
  const otpInput = document.getElementById("otp-input")
  const otp = otpInput.value.trim()

  if (!email || !otp) {
    alert("Please enter the verification code")
    return
  }

  try {
    const response = await fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })

    const data = await response.json()

    if (data.success) {
      // Clear OTP field
      otpInput.value = ""
      alert("Email verified successfully! Please login.")
      sessionStorage.removeItem("pendingVerificationEmail")
      window.showLogin()
    } else {
      // Clear OTP field on failure too
      otpInput.value = ""
      alert(data.error || "Verification failed")
    }
  } catch (error) {
    // Clear OTP field on error
    otpInput.value = ""
    console.error("Verification error:", error)
    alert("Verification failed: " + error.message)
  }
}

window.resendOTP = async () => {
  const email = sessionStorage.getItem("pendingVerificationEmail")

  if (!email) {
    alert("Please try signing up again")
    window.showSignup()
    return
  }

  try {
    const response = await fetch("/api/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (data.success) {
      alert("New verification code sent to your email")
    } else {
      alert(data.error || "Failed to resend verification code")
    }
  } catch (error) {
    console.error("Resend OTP error:", error)
    alert("Failed to resend verification code: " + error.message)
  }
}

// Show/Hide Forms
window.showSignup = () => {
  // Clear login form fields
  document.getElementById("username").value = ""
  document.getElementById("password").value = ""

  // Switch views
  document.getElementById("login-container").classList.add("hidden")
  document.getElementById("signup-container").classList.remove("hidden")
}

window.showLogin = () => {
  // Clear all signup form fields
  document.getElementById("new-username").value = ""
  document.getElementById("new-password").value = ""
  document.getElementById("new-email").value = ""
  document.getElementById("new-department").value = document.getElementById("new-department").options[0].value
  document.getElementById("new-tenure").value = document.getElementById("new-tenure").options[0].value
  document.getElementById("new-employee-id").value = ""

  // Switch views
  document.getElementById("signup-container").classList.add("hidden")
  document.getElementById("login-container").classList.remove("hidden")
}

// Update the signup function to skip OTP verification and show success message directly
window.signup = async () => {
  const username = document.getElementById("new-username").value.trim().toLowerCase()
  const password = document.getElementById("new-password").value
  const email = document.getElementById("new-email").value.trim()
  const department = document.getElementById("new-department").value
  const employeeId = document.getElementById("new-employee-id").value.trim()
  const tenure = document.getElementById("new-tenure").value

  if (!username || !password || !department || !email || !employeeId || !tenure) {
    alert("Please fill in all required fields")
    return
  }

  if (username.toLowerCase() === "admin" || username.toLowerCase().includes("admin")) {
    alert("This username is not allowed")
    return
  }

  if (!validatePassword(password)) {
    alert(
      "Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters",
    )
    return
  }

  if (!validateEmail(email)) {
    alert("Please enter a valid email address")
    return
  }

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, department, email, employeeId, tenure }),
    })

    const data = await response.json()

    if (data.success) {
      // Clear all signup form fields
      document.getElementById("new-username").value = ""
      document.getElementById("new-password").value = ""
      document.getElementById("new-email").value = ""
      document.getElementById("new-employee-id").value = ""

      // Only try to reset these if they exist and have a default option
      const deptSelect = document.getElementById("new-department")
      if (deptSelect && deptSelect.options.length > 0) {
        deptSelect.selectedIndex = 0
      }

      const tenureSelect = document.getElementById("new-tenure")
      if (tenureSelect && tenureSelect.options.length > 0) {
        tenureSelect.selectedIndex = 0
      }

      // Show success message
      const signupContainer = document.getElementById("signup-container")
      signupContainer.innerHTML = `
        <div class="success-message">
          <h4><i class="fas fa-check-circle"></i> Signup Successful!</h4>
          <p>Your account has been created successfully.</p>
          <button onclick="redirectToLogin()" class="btn">Go to Login</button>
        </div>
      `
    } else {
      alert(data.error || "Sign up failed")
    }
  } catch (error) {
    console.error("Signup error:", error)
    alert("Sign up failed: " + error.message)
  }
}

// Add a new function to handle the redirect to login
window.redirectToLogin = () => {
  // Hide the signup container with success message
  document.getElementById("signup-container").classList.add("hidden")

  // Show the login container
  document.getElementById("login-container").classList.remove("hidden")

  // Reset the signup container to its original state for future use
  const signupContainer = document.getElementById("signup-container")
  signupContainer.innerHTML = `
       <h2>Sign Up</h2>
       <div class="signup-form">
         <input type="text" id="new-username" placeholder="Employee Name" autocomplete="off"/>
         <input type="email" id="new-email" placeholder="Email" required autocomplete="off"/>
         <input type="text" id="new-employee-id" placeholder="Employee ID" required autocomplete="off"/>
         <input type="password" id="new-password" placeholder="Password" autocomplete="off"/>
         <select id="new-department" required>
           <option value="" disabled selected>Select Department</option>
           ${DEPARTMENTS.map((dept) => `<option value="${dept.value}">${dept.label}</option>`).join("")}
         </select>
         <select id="new-tenure" required>
           <option value="" disabled selected>Select Tenure</option>
           <option value="0-6 months">0-6 months</option>
           <option value="up to 1 year">up to 1 year</option>
           <option value="Less than 5 years">Less than 5 years</option>
           <option value="more than 5 years">more than 5 years</option>
         </select>
         <button onclick="signup()" class="signup-button">Sign Up</button>
         <div class="form-footer-wrapper">
           <span>Already have an account?</span>
           <button onclick="window.showLogin()" class="link-button">Login</button>
         </div>
       </div>
     `

  // Reload departments in the signup form
  loadDepartments()
}

// Update the login function to properly store user data
async function login() {
  const username = document.getElementById("username").value.trim().toLowerCase()
  const password = document.getElementById("password").value

  try {
    // Now username represents Employee Name
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    })
    const data = await response.json()

    if (response.ok) {
      // Store user data in localStorage with all necessary information
      localStorage.setItem("user", JSON.stringify(data.user))

      // Reset the active survey index to 0 to always start with the first survey
      localStorage.setItem("activeSurveyIndex", "0")

      currentUser = data.user
      startSession()

      // Show the navbar logout button immediately after login
      document.getElementById("navbar-logout").classList.remove("hidden")

      document.getElementById("login-container").classList.add("hidden")
      document.getElementById("signup-container").classList.add("hidden")

      if (currentUser.role === "admin") {
        document.getElementById("admin-panel").classList.remove("hidden")
        await loadDepartmentSurveys()
      } else {
        document.getElementById("employee-panel").classList.remove("hidden")
        await loadAvailableSurveys()
      }
    } else {
      alert(data.error || "Invalid credentials!")
    }
  } catch (error) {
    console.error("Login error:", error)
    alert("Login failed: " + error.message)
  }
}

// Add this function to handle question deletion
function deleteQuestion(button) {
  const questionsContainer = document.getElementById("questions-container")
  const questionInputs = questionsContainer.getElementsByClassName("question-input")

  // Only delete if there's more than one question
  if (questionInputs.length > 1) {
    const questionDiv = button.closest(".question-input")

    // If this question has options, remove them too
    const optionsContainer = questionDiv.querySelector(".options-container")
    if (optionsContainer) {
      optionsContainer.remove()
    }

    // Remove the question div
    questionDiv.remove()
  } else {
    alert("Cannot delete the last question. At least one question is required.")
  }
}

function addOptions(button) {
  const questionDiv = button.parentElement
  const questionType = questionDiv.querySelector(".question-type").value

  // Don't show options for text or star rating questions
  if (questionType === "text" || questionType === "star") {
    return
  }

  // Remove existing options container if it exists
  const existingOptions = questionDiv.querySelector(".options-container")
  if (existingOptions) {
    existingOptions.remove()
  }

  // Create new options container
  const optionsContainer = document.createElement("div")
  optionsContainer.className = "options-container"
  optionsContainer.innerHTML = `
        <div class="option-input-group">
            <input type="text" class="options-input" placeholder="Enter option" />
            <button onclick="addNewOption(this)" class="add-option-btn">+</button>
        </div>
        <span class="options-help">Add your options here. Click + to add more options.</span>
    `

  questionDiv.appendChild(optionsContainer)
}

// Add an event listener to handle question type changes
document.addEventListener("change", (e) => {
  if (e.target.classList.contains("question-type")) {
    const addOptionsButton = e.target.parentElement.querySelector("button")
    if (e.target.value === "text" || e.target.value === "star") {
      addOptionsButton.style.display = "none"
    } else {
      addOptionsButton.style.display = "inline-block"
    }
  }
})

function addNewOption(button) {
  const optionsContainer = button.closest(".options-container")
  const newOptionGroup = document.createElement("div")
  newOptionGroup.className = "option-input-group"
  newOptionGroup.innerHTML = `
        <input type="text" class="options-input" placeholder="Enter option" />
        <button onclick="removeOption(this)" class="remove-option-btn">-</button>
    `
  optionsContainer.insertBefore(newOptionGroup, optionsContainer.querySelector(".options-help"))
}

function removeOption(button) {
  button.closest(".option-input-group").remove()
}

// Update your existing addQuestion function to include the delete button
function addQuestion() {
  const questionsContainer = document.getElementById("questions-container")
  const newQuestion = document.createElement("div")
  newQuestion.className = "question-input"
  newQuestion.innerHTML = `
        <input type="text" placeholder="Question" class="question" />
        <select class="question-type">
            <option value="text">Text</option>
            <option value="radio">Multiple Choice</option>
            <option value="checkbox">Checkbox</option>
            <option value="star">Star Rating</option>
        </select>
        <button onclick="addOptions(this)">Add Options</button>
        <button onclick="deleteQuestion(this)" class="delete-btn">❌</button>
    `
  questionsContainer.appendChild(newQuestion)
}

// Handle question type change
window.handleQuestionTypeChange = (select) => {
  const optionsContainer = select.parentElement.querySelector(".options-container")
  if (select.value === "radio" || select.value === "checkbox") {
    optionsContainer.classList.remove("hidden")
  } else {
    optionsContainer.classList.add("hidden")
  }
}

// Add option function
window.addOption = (button) => {
  const optionsInput = button.previousElementSibling
  const currentOptions = optionsInput.value ? optionsInput.value.split(",") : []
  const newOption = prompt("Enter option:")

  if (newOption && newOption.trim()) {
    currentOptions.push(newOption.trim())
    optionsInput.value = currentOptions.join(",")
  }
}

// Load Department Surveys
// Update the loadDepartmentSurveys function to display surveys with the title outside the card
async function loadDepartmentSurveys() {
  try {
    // Get all available departments
    const deptResponse = await fetch("/api/departments")
    const allDepartments = await deptResponse.json()

    const container = document.getElementById("department-surveys")
    let html = ""

    // First, fetch and display "All Departments" surveys
    const allDeptResponse = await fetch("/api/surveys/all")
    const allDeptSurveys = await allDeptResponse.json()
    
    const allDepartmentSurveys = allDeptSurveys.filter(survey => survey.isAllDepartments === true)
    
    if (allDepartmentSurveys.length > 0) {
      html += `
        <div class="department-section">
          <h4>All Departments</h4>
          ${allDepartmentSurveys
            .map(
              (survey) => `
              <div class="survey-card" style="--survey-color: ${survey.color || "#253074"}; border-color: ${survey.color || "#253074"}">
                  <div class="survey-title-box" style="background-color: ${survey.color || "#253074"}">${survey.title}</div>
                  <p>Department: All Departments</p>
                  <button onclick="deleteSurvey('${survey._id}')" class="delete-button">Delete Survey</button>
              </div>
          `,
            )
            .join("")}
        </div>
      `
    }

    // Then fetch and display surveys for each specific department
    for (const dept of allDepartments) {
      const response = await fetch(`/api/surveys/${dept}`)
      const surveys = await response.json()

      // Filter out "All Departments" surveys (they're already shown above) and duplicates
      const deptSpecificSurveys = surveys.filter(survey => 
        survey.isAllDepartments !== true && 
        survey.department === dept
      )

      if (deptSpecificSurveys.length > 0) {
        html += `
          <div class="department-section">
              <h4>${dept}</h4>
              ${deptSpecificSurveys
                .map(
                  (survey) => `
                  <div class="survey-card" style="--survey-color: ${survey.color || "#253074"}; border-color: ${survey.color || "#253074"}">
                      <div class="survey-title-box" style="background-color: ${survey.color || "#253074"}">${survey.title}</div>
                      <p>Department: ${survey.department}</p>
                      <button onclick="deleteSurvey('${survey._id}')" class="delete-button">Delete Survey</button>
                  </div>
              `,
                )
                .join("")}
          </div>
        `
      }
    }

    container.innerHTML = html || "<p>No surveys available</p>"
  } catch (error) {
    console.error("Error loading department surveys:", error)
    document.getElementById("department-surveys").innerHTML = "<p>Error loading surveys</p>"
  }
}

// Delete Survey
window.deleteSurvey = async (surveyId) => {
  if (!confirm("Are you sure you want to delete this survey?")) {
    return
  }

  try {
    const response = await fetch(`/api/surveys/${surveyId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      // Remove the survey card from the UI
      const surveyCard = document.querySelector(`.survey-card[data-survey-id="${surveyId}"]`)
      if (surveyCard) {
        surveyCard.remove()
      }

      // Refresh the surveys display
      await loadDepartmentSurveys()
      await displayActiveSurveys()
    } else {
      const data = await response.json()
      alert(data.error || "Failed to delete survey")
    }
  } catch (error) {
    console.error("Delete error:", error)
    alert("Error deleting survey: " + error.message)
  }
}

// Create Survey
window.createSurvey = async () => {
  const isAllDepartments = document.getElementById("all-departments-checkbox")?.checked
  const departmentSelect = document.getElementById("admin-department")
  const department = isAllDepartments ? "All Departments" : departmentSelect.value
  const title = document.getElementById("survey-title").value
  const color = document.getElementById("survey-color").value // Get the color value

  if (!title) {
    alert("Please enter a survey title")
    return
  }

  // Check if department is selected or All Departments is checked
  if (!isAllDepartments && (!departmentSelect.value || departmentSelect.value === "")) {
    alert("Please select a department or check 'All Departments'")
    return
  }

  const questions = []
  let isValid = true

  document.querySelectorAll(".question-input").forEach((questionDiv, index) => {
    const questionText = questionDiv.querySelector(".question").value
    const questionType = questionDiv.querySelector(".question-type").value

    if (!questionText) {
      alert("Please fill in all questions")
      isValid = false
      return
    }

    const question = {
      text: questionText,
      type: questionType,
    }

    // Only validate options for radio and checkbox questions
    if (questionType === "radio" || questionType === "checkbox") {
      const optionInputs = questionDiv.querySelectorAll(".options-input")
      const options = []

      optionInputs.forEach((input) => {
        if (input.value.trim()) {
          options.push(input.value.trim())
        }
      })

      if (options.length < 2) {
        alert("Please provide at least 2 options for multiple choice/checkbox questions")
        isValid = false
        return
      }
      question.options = options
    }

    questions.push(question)
  })

  if (!isValid || questions.length === 0) return

  try {
    const response = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department,
        title,
        questions,
        isAllDepartments,
        color, // Include the color in the request
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to create survey")
    }

    alert(isAllDepartments ? "Survey created successfully for all departments!" : "Survey created successfully!")

    // Only try to display active surveys if the element exists
    if (document.getElementById("active-surveys")) {
      await displayActiveSurveys()
    }
    await loadDepartmentSurveys()
    clearSurveyForm()
  } catch (error) {
    console.error("Survey creation error:", error)
    alert("Error creating survey: " + error.message)
  }
}

// Display Active Surveys
async function displayActiveSurveys() {
  try {
    const response = await fetch("/api/surveys/active")
    const surveys = await response.json()

    const container = document.getElementById("active-surveys")
    // Check if container exists before setting innerHTML
    if (!container) {
      console.warn("active-surveys container not found")
      return
    }

    container.innerHTML = surveys
      .map(
        (survey) => `
            <div class="survey-card">
                <h4>${survey.title}</h4>
                <p>Department: ${survey.department}</p>
                <p>Created: ${new Date(survey.createdAt).toLocaleDateString()}</p>
            </div>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading active surveys:", error)
  }
}

// Load Available Surveys
async function loadAvailableSurveys() {
  try {
    const container = document.getElementById("available-surveys")
    if (!container) {
      console.warn("available-surveys container not found")
      return
    }

    // Get submitted surveys from localStorage
    const submittedSurveyIds = JSON.parse(localStorage.getItem("submittedSurveys") || "[]")
    const submittedSurveySet = new Set(submittedSurveyIds)

    // Get available surveys for the user's department
    const response = await fetch(`/api/surveys/${currentDepartment}`)
    const surveys = await response.json()

    // Filter out submitted surveys and ensure proper sequential ordering
    const availableSurveys = surveys
      .filter((survey) => !submittedSurveySet.has(survey._id))
      // Sort by createdAt date to ensure consistent ordering
      .sort((a, b) => {
        // First try to sort by createdAt date
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt) - new Date(b.createdAt)
        }
        // Fallback to _id comparison if createdAt is not available
        return a._id.localeCompare(b._id)
      })

    // Store the count in localStorage for navigation
    localStorage.setItem("availableSurveysCount", availableSurveys.length.toString())

    if (availableSurveys.length === 0) {
      // Show a message with a return button when no surveys are available
      container.innerHTML = `
        <div class="no-surveys-message">
          <h4><i class="fas fa-info-circle"></i> No Surveys Available</h4>
          <p>There are currently no surveys available for your department.</p>
          <button onclick="resetSurvey()" class="btn" style="background-color: #253074; color: white; margin-top: 15px; padding: 10px 20px;">Return to Dashboard</button>
        </div>
      `
      return
    }

    // Get the active survey index from localStorage
    let activeIndex = Number.parseInt(localStorage.getItem("activeSurveyIndex") || "0")

    // Make sure activeIndex is within bounds
    if (activeIndex >= availableSurveys.length) {
      activeIndex = 0
      localStorage.setItem("activeSurveyIndex", "0")
    }

    // Store the count in localStorage for navigation
    localStorage.setItem("availableSurveysCount", availableSurveys.length.toString())

    // Display the active survey
    const activeSurvey = availableSurveys[activeIndex]

    container.innerHTML = `
      <div class="survey-card" style="--survey-color: ${activeSurvey.color || "#253074"}; border-color: ${activeSurvey.color || "#253074"}">
        <div class="survey-title-box" style="background-color: ${activeSurvey.color || "#253074"}">${activeSurvey.title}</div>
        <form onsubmit="submitSurvey(event, '${activeSurvey._id}')">
          <div class="survey-questions-container">
            ${generateSurveyColumns(activeSurvey.questions, activeSurvey.color)}
          </div>
          <div class="center-submit">
            <button type="submit" style="background-color: ${activeSurvey.color || "#253074"}">Submit Survey</button>
          </div>
        </form>
        <div class="return-dashboard-container" style="text-align: center; margin-top: 15px;">
          <button onclick="resetSurvey()" class="btn-secondary" style="background-color: #f8f9fa; color: #253074; border: 1px solid #253074; padding: 8px 15px;">Return to Dashboard</button>
        </div>
      </div>
      <div class="survey-counter">Survey ${activeIndex + 1} of ${availableSurveys.length}</div>
      ${
        availableSurveys.length > 1
          ? `<div class="survey-navigation">
               <button onclick="navigateSurvey('prev')" class="nav-button" ${activeIndex === 0 ? "disabled" : ""} style="background-color: ${activeSurvey.color || "#253074"}">Previous</button>
               <button onclick="navigateSurvey('next')" class="nav-button" ${activeIndex === availableSurveys.length - 1 ? "disabled" : ""} style="background-color: ${activeSurvey.color || "#253074"}">Next</button>
             </div>`
          : ""
      }
    `
    // Replace this line at the end of loadAvailableSurveys:
    // container.insertAdjacentHTML("beforeend", '<div class="answer-progress"></div>')
    // updateAnswerProgress()

    // With this code:
    if (availableSurveys.length > 0) {
      container.insertAdjacentHTML("beforeend", '<div class="answer-progress"></div>')
      try {
        updateAnswerProgress()
      } catch (err) {
        console.error("Error updating answer progress:", err)
        // Don't let this error break the whole survey loading
      }
    }
  } catch (error) {
    console.error("Error loading available surveys:", error)
    const container = document.getElementById("available-surveys")
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Surveys</h4>
          <p>There was a problem loading surveys. Please try again later.</p>
          <button onclick="resetSurvey()" class="btn" style="background-color: #253074; color: white; margin-top: 15px; padding: 10px 20px;">Return to Dashboard</button>
        </div>
      `
    }
  }
}

// Update the submitSurvey function to only show success message after the last survey
window.submitSurvey = async (event, surveyId) => {
  event.preventDefault()

  const form = event.target

  // At the beginning of submitSurvey function:
  if (!form) {
    console.error("Form not found")
    alert("Error submitting survey: Form not found")
    return
  }

  const formData = new FormData(form)
  const answers = new Map()

  // Get all questions in the form
  const questions = form.querySelectorAll(".survey-question")
  const totalQuestions = questions.length
  let answeredQuestions = 0
  const unansweredQuestions = []

  // Check each question for answers
  questions.forEach((question, index) => {
    const questionType = question.dataset.type
    let isAnswered = false

    if (questionType === "star") {
      // For star rating questions, check if any radio button is selected
      const starInputs = question.querySelectorAll('input[type="radio"]')
      isAnswered = Array.from(starInputs).some((input) => input.checked)
    } else if (questionType === "radio") {
      // For regular radio questions
      isAnswered = question.querySelector('input[type="radio"]:checked') !== null
    } else if (questionType === "checkbox") {
      // For checkbox questions
      isAnswered = question.querySelector('input[type="checkbox"]:checked') !== null
    } else if (questionType === "text") {
      // For text questions
      const textInput = question.querySelector('input[type="text"], textarea')
      isAnswered = textInput && textInput.value.trim() !== ""
    }

    if (isAnswered) {
      answeredQuestions++
    } else {
      unansweredQuestions.push(index + 1)
    }
  })

  // Check if all questions are answered
  if (answeredQuestions < totalQuestions) {
    alert("Please answer all questions")

    // Highlight unanswered questions
    questions.forEach((question, index) => {
      const questionType = question.dataset.type
      let isAnswered = false

      if (questionType === "star") {
        const starInputs = question.querySelectorAll('input[type="radio"]')
        isAnswered = Array.from(starInputs).some((input) => input.checked)
      } else if (questionType === "radio") {
        isAnswered = question.querySelector('input[type="radio"]:checked') !== null
      } else if (questionType === "checkbox") {
        isAnswered = question.querySelector('input[type="checkbox"]:checked') !== null
      } else if (questionType === "text") {
        const textInput = question.querySelector('input[type="text"], textarea')
        isAnswered = textInput && textInput.value.trim() !== ""
      }

      if (!isAnswered) {
        question.classList.add("highlight-required")
        question.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        question.classList.remove("highlight-required")
      }
    })

    return
  }

  // Collect all answers from the form
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("q")) {
      answers.set(name, value)
      answeredQuestions++
    }
  }

  // Handle checkbox inputs separately
  const checkboxGroups = new Map()
  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    const name = checkbox.name
    if (!checkboxGroups.has(name)) {
      checkboxGroups.set(name, [])
    }

    if (checkbox.checked) {
      const values = checkboxGroups.get(name)
      values.push(checkbox.value)
      checkboxGroups.set(name, values)
    }
  })

  // Add checkbox answers to the answers map
  checkboxGroups.forEach((values, name) => {
    if (values.length > 0) {
      answers.set(name, values)
      answeredQuestions++
    }
  })

  // Convert answers Map to regular object
  const answersObject = {}
  answers.forEach((value, key) => {
    answersObject[key] = Array.isArray(value) ? value.join(", ") : value
  })

  try {
    const response = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surveyId,
        userId: `${currentDepartment}_${currentTenure}_${Date.now()}`, // Generate unique ID
        department: currentDepartment,
        tenure: currentTenure, // Add this line
        answers: answersObject,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Add the survey ID to the submitted surveys set
      window.submittedSurveys.add(surveyId)

      // Store submitted surveys in localStorage
      const submittedSurveyIds = Array.from(window.submittedSurveys)
      localStorage.setItem("submittedSurveys", JSON.stringify(submittedSurveyIds))

      // Inside submitSurvey function, add a check before accessing the survey card:
      const surveyCard = form.closest(".survey-card")
      if (!surveyCard) {
        console.error("Survey card not found")
        alert("Error submitting survey: Survey form not found")
        return
      }

      // Get available surveys for the department
      const availableSurveysResponse = await fetch(`/api/surveys/${currentDepartment}`)
      const allSurveys = await availableSurveysResponse.json()

      // Filter out submitted surveys
      const remainingSurveys = allSurveys.filter((survey) => !window.submittedSurveys.has(survey._id))

      // Check if this was the last survey
      const isLastSurvey = remainingSurveys.length === 0

      if (isLastSurvey) {
        // For the last survey, immediately show success message without any delay
        surveyCard.innerHTML = `
    <div class="success-message">
      <h4><i class="fas fa-check-circle"></i> Survey Submitted Successfully!</h4>
      <p>Thank you for your feedback.</p>
      <button onclick="resetSurvey()" class="btn" style="background-color: #253074; color: white; margin-top: 15px; padding: 10px 20px;">Return to Dashboard</button>
    </div>
  `
      } else {
        // For non-last surveys, clear the survey card and refresh
        surveyCard.innerHTML = ""

        // Update the activeIndex for the next survey and refresh
        localStorage.setItem("activeSurveyIndex", "0") // Always reset to the first remaining survey
        localStorage.removeItem("availableSurveysCount") // Force recalculation of available surveys

        // Refresh surveys for remaining surveys
        await loadAvailableSurveys()
      }
    } else {
      throw new Error(data.error || "Failed to submit survey")
    }
  } catch (error) {
    console.error("Survey submission error:", error)
    alert("Error submitting survey: " + error.message)
  }
}

// Add a function to reset the survey
window.resetSurvey = () => {
  // Clear department and tenure
  localStorage.removeItem("surveyDepartment")
  localStorage.removeItem("surveyTenure")
  localStorage.removeItem("activeSurveyIndex")
  localStorage.removeItem("availableSurveysCount")
  currentDepartment = null
  currentTenure = null

  // Clear submitted surveys
  window.submittedSurveys.clear()
  localStorage.removeItem("submittedSurveys")

  // Show the user info form
  document.getElementById("employee-panel").classList.add("hidden")
  document.getElementById("user-info-container").classList.remove("hidden")
}

// Function to generate survey columns
function generateSurveyColumns(questions, color) {
  // Reset the question counter
  let questionCounter = 1

  return questions
    .map(
      (question, index) => `
        <div class="survey-question" data-type="${question.type}" data-question-number="${questionCounter++}">
          <p>${question.text}</p>
          ${generateQuestionInputs(question, color, index)}
        </div>
      `,
    )
    .join("")
}

// Function to generate question inputs based on type
function generateQuestionInputs(question, color, index) {
  switch (question.type) {
    case "text":
      return `<div class="input-field-container"><textarea name="q${index}" required class="response-input" rows="5" cols="150"></textarea></div>`
    case "radio":
      return `
        <div class="radio-options-container">
          ${question.options
            .map(
              (option) => `
                <div class="radio-option">
                  <input 
                    type="radio" 
                    id="q${index}_${option.replace(/\s+/g, "_")}"
                    name="q${index}" 
                    value="${option}"
                    required
                  />
                  <label for="q${index}_${option.replace(/\s+/g, "_")}">${option}</label>
                </div>
              `,
            )
            .join("")}
        </div>
      `
    case "checkbox":
      return `
        <div class="checkbox-options-container">
          ${question.options
            .map(
              (option) => `
                <div class="checkbox-option">
                  <input 
                    type="checkbox" 
                    id="q${index}_${option.replace(/\s+/g, "_")}"
                    name="q${index}" 
                    value="${option}"
                  />
                  <label for="q${index}_${option.replace(/\s+/g, "_")}">${option}</label>
                </div>
              `,
            )
            .join("")}
        </div>
      `
    case "star":
      return `<div class="star-rating">
        ${Array.from({ length: 5 }, (_, i) => i + 1)
          .map(
            (star) => `
            <label>
              <input type="radio" name="q${index}" value="${star}" style="background-color: ${color}" />
              <i class="fas fa-star"></i>
            </label>
          `,
          )
          .join("")}
      </div>`
    default:
      return ""
  }
}

// Find the updateAnswerProgress function and replace it with this safer version
function updateAnswerProgress() {
  const container = document.getElementById("available-surveys")
  if (!container) return

  const surveyCard = container.querySelector(".survey-card")
  if (!surveyCard) return

  const questionsContainer = surveyCard.querySelector(".survey-questions-container")
  if (!questionsContainer) return

  const questions = questionsContainer.querySelectorAll(".survey-question")
  if (!questions || questions.length === 0) return

  const answeredQuestions = Array.from(questions).filter((q) => {
    if (!q) return false

    const questionType = q.dataset.type

    if (questionType === "radio") {
      return q.querySelector('input[type="radio"]:checked') !== null
    } else if (questionType === "checkbox") {
      return q.querySelector('input[type="checkbox"]:checked') !== null
    } else if (questionType === "text") {
      const textInput = q.querySelector('input[type="text"], textarea')
      return textInput && textInput.value && textInput.value.trim() !== ""
    } else if (questionType === "star") {
      return q.querySelector('input[type="radio"]:checked') !== null
    }

    return false
  }).length

  const progressContainer = container.querySelector(".answer-progress")
  if (progressContainer) {
    progressContainer.innerHTML = `<p>Answered ${answeredQuestions} of ${questions.length} questions</p>`
  }
}

// Function to load departments
function loadDepartments() {
  const deptSelect = document.getElementById("new-department")
  if (deptSelect) {
    deptSelect.innerHTML = `
      <option value="" disabled selected>Select Department</option>
      ${DEPARTMENTS.map((dept) => `<option value="${dept.value}">${dept.label}</option>`).join("")}
    `
  }
}

// Function to logout
function logout() {
  // Clear user data from localStorage
  localStorage.removeItem("user")
  localStorage.removeItem("surveyDepartment")
  localStorage.removeItem("surveyTenure")
  localStorage.removeItem("isAdmin")
  localStorage.removeItem("activeSurveyIndex")

  // Clear session timeout
  clearSession()

  // Reset current user and department
  currentUser = null
  currentDepartment = null
  currentTenure = null
  isAdmin = false

  // Show login form
  document.getElementById("user-info-container").classList.remove("hidden")
  document.getElementById("employee-panel").classList.add("hidden")
  document.getElementById("admin-panel").classList.add("hidden")
  document.getElementById("admin-logout").classList.add("hidden")
  document.getElementById("navbar-logout").classList.add("hidden")
}

// Function to clear survey form
function clearSurveyForm() {
  const questionsContainer = document.getElementById("questions-container")
  questionsContainer.innerHTML = ""
}

// Function to navigate surveys
window.navigateSurvey = (direction) => {
  // Get the active survey index from localStorage
  const activeIndex = Number.parseInt(localStorage.getItem("activeSurveyIndex") || "0")

  // Get available surveys count from localStorage (we'll set this in loadAvailableSurveys)
  const availableSurveysCount = Number.parseInt(localStorage.getItem("availableSurveysCount") || "0")

  let newIndex = activeIndex
  if (direction === "prev") {
    newIndex = Math.max(0, activeIndex - 1)
  } else if (direction === "next") {
    newIndex = Math.min(availableSurveysCount - 1, activeIndex + 1)
  }

  localStorage.setItem("activeSurveyIndex", newIndex.toString())
  loadAvailableSurveys()
}

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // Check login state when page loads
  checkLoginState()

  // Add visibility change listener to handle tab switching/reopening
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // When tab becomes visible again, check login state
      checkLoginState()
    }
  })
})

function toggleDepartmentSelect() {
    const checkbox = document.getElementById('all-departments-checkbox');
    const departmentSelect = document.getElementById('admin-department');
    
    if (checkbox.checked) {
        departmentSelect.disabled = true;
        departmentSelect.style.opacity = '0.5';
    } else {
        departmentSelect.disabled = false;
        departmentSelect.style.opacity = '1';
    }
}