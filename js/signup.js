document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000/api";

    const signupForm = document.querySelector("form");

    if (!signupForm) {
        console.error("Signup form not found.");
        return;
    }

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document
            .getElementById("username")
            .value
            .trim();

        const factoryName = document
            .getElementById("factoryName")
            .value
            .trim();

        const email = document
            .getElementById("email")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        const termsCheckbox =
            signupForm.querySelector(
                'input[type="checkbox"]'
            );

        // Terms validation
        if (termsCheckbox && !termsCheckbox.checked) {
            alert(
                "Please agree to the Terms of Service and Privacy Policy."
            );
            return;
        }

        // Basic validation
        if (!name || !factoryName || !email || !password) {
            alert(
                "Please fill in all required fields."
            );
            return;
        }

        if (password.length < 6) {
            alert(
                "Password must be at least 6 characters."
            );
            return;
        }

        const submitButton =
            signupForm.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Creating Account...";
        }

        try {
            const response = await fetch(
                `${API_BASE}/auth/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        factoryName,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Signup failed."
                );
            }

            // Save login session
            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            localStorage.setItem(
                "factory",
                JSON.stringify(data.factory)
            );

            alert(
                "Factory account created successfully!"
            );

            // Open dashboard
            window.location.href =
                "../dashboard.html";

        } catch (error) {
            console.error(
                "Signup Error:",
                error
            );

            alert(
                error.message ||
                "Unable to create account."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent =
                    "Create Account";
            }
        }
    });
});