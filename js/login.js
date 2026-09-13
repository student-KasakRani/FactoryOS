// =========================================
// FactoryOS - LOGIN
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!form || !emailInput || !passwordInput) {
        return;
    }

    let messageBox = document.getElementById("loginMessage");

    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "loginMessage";
        messageBox.className =
            "hidden mt-4 p-3 rounded-lg text-sm font-medium";

        form.appendChild(messageBox);
    }

    function showMessage(message, type = "error") {

        messageBox.classList.remove(
            "hidden",
            "bg-red-50",
            "border-red-200",
            "text-red-700",
            "bg-green-50",
            "border-green-200",
            "text-green-700"
        );

        if (type === "success") {

            messageBox.classList.add(
                "bg-green-50",
                "border",
                "border-green-200",
                "text-green-700"
            );

        } else {

            messageBox.classList.add(
                "bg-red-50",
                "border",
                "border-red-200",
                "text-red-700"
            );

        }

        messageBox.textContent = message;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {

            showMessage(
                "Please enter your email and password."
            );

            return;
        }

        const submitButton =
            form.querySelector('button[type="submit"]');

        const originalText =
            submitButton
                ? submitButton.textContent
                : "Sign In";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Signing In...";
        }

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Login failed."
                );

            }

            // Save JWT
            localStorage.setItem(
                "token",
                data.token
            );

            // Save logged-in user
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            showMessage(
                "Login successful. Redirecting...",
                "success"
            );

            setTimeout(() => {

                window.location.href =
                    "../index.html";

            }, 500);

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to login. Please try again."
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }

        }

    });

});