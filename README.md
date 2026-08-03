<div align="center">

# 🔐 Secure Prompt Generator

### A Secure Prompt Engineering Platform for Large Language Models (LLMs)

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI-38BDF8?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM-orange)
![License](https://img.shields.io/badge/License-Academic-lightgrey)

**Summer 2026 Cybersecurity Internship**

**Université du Québec en Outaouais (UQO)**

</div>

---

# 📖 Overview

Secure Prompt Generator is a web application designed to improve the security of interactions with Large Language Models (LLMs).

Instead of writing prompts manually, users select predefined cybersecurity scenarios and Prompt Engineering strategies. The application then generates structured prompts that guide the LLM toward more secure, reliable, and explainable outputs.

The project was developed during a Summer 2026 cybersecurity internship at the Université du Québec en Outaouais.

---

# ✨ Features

## 🔵 Secure Code Generation

Generate secure prompts for:

- Authentication systems
- REST APIs
- SQL queries
- JWT Authentication
- File Upload
- Password Storage
- XSS Protection
- CSRF Protection

---

## 🟢 Code Security Verification

Analyze existing code against security best practices.

Supported topics include:

- SQL Injection
- Cross-Site Scripting (XSS)
- Access Control
- Password Storage
- JWT Security
- Session Security
- CSRF Protection
- File Upload Security
- Error Handling

---

# 🧠 Prompt Engineering Strategies

The application currently implements multiple Prompt Engineering techniques.

| Strategy | Description |
|-----------|-------------|
| Role Prompting | Assign a cybersecurity expert role to the LLM |
| One-shot Prompting | Provide an example before asking the task |
| Threat Modeling | Identify potential threats before implementation |
| Security Requirements | Define explicit security constraints |
| Security Criteria Prompting | Guide generation using predefined criteria |
| Least Privilege | Encourage minimum required permissions |
| OWASP Compliance | Follow OWASP recommendations |
| Self Verification | Ask the LLM to review its own output |
| Secure Refactoring | Improve insecure code |
| Vulnerability Analysis | Detect security weaknesses |
| Attack Simulation | Simulate attacker behavior |
| Security Scoring | Evaluate overall security |
| Patch Generation | Generate secure fixes |
| **Microsoft Method** | Multi-step reasoning strategy |

---

# 🧩 Microsoft Method

This strategy was implemented following the feedback received during the internship.

It guides the LLM through four reasoning steps:

1. Understand what the program does.
2. Identify what could go wrong.
3. Determine how to prevent these issues.
4. Verify that the proposed solution satisfies these requirements.

This structured reasoning improves the quality and explainability of generated prompts.

---

# 🏗 Architecture

```
                React + Vite
                      │
                      │
              REST API (Axios)
                      │
                      ▼
              FastAPI Backend
                      │
        ┌─────────────┴─────────────┐
        │                           │
 Scenario Loader            Strategy Loader
        │                           │
        └─────────────┬─────────────┘
                      │
             Prompt Generator
                      │
               OpenRouter API
                      │
                 LLM Response
                      │
            Conversation History
```

---

# 📂 Project Structure

```
Secure_Prompt_Generator

├── backend
│   ├── scenarios
│   ├── strategies
│   ├── main.py
│   ├── database.py
│   ├── scenario_loader.py
│   └── strategy_loader.py
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── strategies
│   │   ├── utils
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md
```

---

# 💻 Technologies

## Frontend

- React
- Vite
- TailwindCSS
- Axios

---

## Backend

- Python
- FastAPI
- SQLite
- OpenRouter API

---

## Deployment

Frontend

- Vercel

Backend

- Render

---

# 🚀 Installation

## Clone repository

```bash
git clone https://github.com/Ulrich120/Secure_Prompt_Generator.git

cd Secure_Prompt_Generator
```

---

## Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate

# Windows

.venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Swagger:

```
http://localhost:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Application:

```
http://localhost:5173
```

---

# 🌐 Live Demo

Frontend

https://secure-prompt-generator-phi.vercel.app

Backend API

https://secure-prompt-generator-api.onrender.com

---

# 📸 Screenshots

## Home Page

> *(Insert screenshot here)*

---

## Scenario Selection

> *(Insert screenshot here)*

---

## Prompt Generation

> *(Insert screenshot here)*

---

## Attack Simulation Dashboard

> *(Insert screenshot here)*

---

# 📈 Future Improvements

- User authentication
- Scenario editor
- Strategy editor
- Export prompts
- Export conversations
- AI-generated scenarios
- AI-generated strategies
- Support multiple LLM providers
- Prompt versioning
- Prompt comparison dashboard

---

# 👨‍💻 Author

**Ulrich Dongmo**

Bachelor of Computer Engineering

Université du Québec en Outaouais

Summer 2026 Cybersecurity Internship

GitHub

https://github.com/Ulrich120

---

# 🙏 Acknowledgements

This project was developed during a supervised cybersecurity internship at the Université du Québec en Outaouais (UQO).

Special thanks to the internship supervisor for valuable feedback on prompt engineering methodologies and secure AI interaction design.

---

# 📄 License

This project is intended for academic and research purposes.