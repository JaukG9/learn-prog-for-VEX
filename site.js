document.documentElement.classList.add("js");

(function(){
    const PAGES = [
        {id: "home", title: "Home"},
        {id: "setup", title: "Setup", lesson: true},
        {id: "cpp", title: "Basic C++", lesson: true},
        {id: "pros", title: "PROS", lesson: true},
        {id: "driver", title: "Driver Control", lesson: true},
        {id: "concepts", title: "Concepts", lesson: true},
        {id: "lemlib", title: "LemLib", lesson: true},
        {id: "practice", title: "Practice"},
        {id: "cheat", title: "Cheat Sheet"},
        {id: "glossary", title: "Glossary"},
        {id: "trouble", title: "Troubleshooting"}
    ];

    let progress = {};
    try{
        progress = JSON.parse(localStorage.getItem("prosProgress") || "{}");
    }catch(e){}

    function saveProgress(){
        try{
            localStorage.setItem("prosProgress", JSON.stringify(progress));
        }catch(e){}
    }

    const navLinks = document.getElementById("navLinks");
    const progressText = document.createElement("div");
    progressText.className = "progress";
    navLinks.parentNode.appendChild(progressText);

    function currentId(){
        const id = location.hash.slice(1);
        return PAGES.some(p => p.id === id) ? id : "home";
    }

    function renderNav(){
        const cur = currentId();
        navLinks.innerHTML = "";

        PAGES.forEach(p => {
            const a = document.createElement("a");
            a.href = "#" + p.id;
            a.textContent = p.title + (progress[p.id] ? " ✓" : "");
            if(p.id === cur) a.className = "active";
            navLinks.appendChild(a);
        });

        const lessons = PAGES.filter(p => p.lesson);
        const done = lessons.filter(p => progress[p.id]).length;
    }

    function showPage(){
        const cur = currentId();
        document.querySelectorAll(".page").forEach(s => {
            s.classList.toggle("show", s.id === cur);
        });
        renderNav();
        window.scrollTo(0, 0);
    }

    function addFooters(){
        PAGES.forEach((p, i) => {
            if(!(p.id === "home" || p.lesson)) return;

            const section = document.getElementById(p.id);
            if(!section) return;

            const prev = PAGES[i - 1];
            const next = PAGES[i + 1];

            const footer = document.createElement("div");
            footer.className = "page-footer";

            const prevBtn = document.createElement("button");
            if(prev){
                prevBtn.textContent = "← " + prev.title;
                prevBtn.onclick = () => { location.hash = prev.id; };
            }else{
                prevBtn.style.visibility = "hidden";
            }
            footer.appendChild(prevBtn);

            if(p.lesson){
                const doneBtn = document.createElement("button");
                const paint = () => {
                    doneBtn.textContent = progress[p.id] ? "Completed ✓ (click to undo)" : "Mark complete";
                };
                paint();
                doneBtn.onclick = () => {
                    progress[p.id] = !progress[p.id];
                    saveProgress();
                    paint();
                    renderNav();
                };
                footer.appendChild(doneBtn);
            }

            const nextBtn = document.createElement("button");
            if(next){
                nextBtn.textContent = next.title + " →";
                nextBtn.onclick = () => { location.hash = next.id; };
            }else{
                nextBtn.style.visibility = "hidden";
            }
            footer.appendChild(nextBtn);

            section.appendChild(footer);
        });
    }

    const QUIZZES = {
        setup: [
            {
                q: "In the first program, what does pros::delay(20) do?",
                options: ["Waits 20 ms so the brain isn't overloaded", "Runs the motor for 20 seconds", "Slows the motor down by 20%", "Nothing, you can delete it"],
                why: "Without a delay, the loop runs as fast as possible and starves the brain's other tasks."
            },
            {
                q: "What do you expect to happen if you change 200 to -200?",
                options: ["The motor spins in the opposite direction", "The motor stops", "The program won't build", "The motor spins twice as fast"],
                why: "The sign of the velocity sets the direction."
            },
            {
                q: "Where do you write your robot code in a new PROS project?",
                options: ["src/main.cpp", "include/main.h", "project.pros", "firmware/"],
                why: "main.cpp holds the competition functions, like opcontrol()."
            }
        ],

        cpp: [
            {
                q: "Which type stores a true or false value?",
                options: ["bool", "int", "double", "char"],
                why: "A bool is for true/false, like clawClosed."
            },
            {
                q: "What does doubleIt(4) return?",
                options: ["8", "4", "2", "16"],
                why: "The function returns n * 2, and 4 * 2 is 8."
            },
            {
                q: "What does pros::Motor motor(1); do?",
                options: ["Creates a Motor object named motor on port 1", "Moves the motor at speed 1", "Imports the motor library", "Calls a function named motor"],
                why: "You give the type, then the name, then any parameters (the port)."
            },
            {
                q: "In pros::delay, what is pros::?",
                options: ["A namespace", "A variable", "A loop", "A motor"],
                why: "A namespace tells C++ where something comes from. Here, the PROS library."
            },
            {
                q: "If speed is 120 before the if/else example runs, what is speed afterwards?",
                options: ["100", "120", "121", "0"],
                why: "120 is greater than 100, so the if branch sets it back to 100."
            }
        ],

        pros: [
            {
                q: "Which function runs during the driver control period?",
                options: ["opcontrol()", "initialize()", "autonomous()", "disabled()"],
                why: "opcontrol() is driver control."
            },
            {
                q: "Where should you calibrate sensors?",
                options: ["initialize()", "opcontrol()", "disabled()", "Inside the while loop"],
                why: "initialize() runs once when the program starts."
            },
            {
                q: "Which function is meant for an auton selector before a match?",
                options: ["competition_initialize()", "autonomous()", "opcontrol()", "disabled()"],
                why: "It runs when the brain connects to field control, before the match starts."
            },
            {
                q: "What does controller.get_analog() return?",
                options: ["A number from -127 to 127", "0 or 1", "true or false", "A number from 0 to 100"],
                why: "Joysticks report values from -127 to 127. Buttons (get_digital) are 0 or 1."
            },
            {
                q: "Which one prints to the PROS terminal instead of the brain screen?",
                options: ["printf()", "pros::lcd::print()", "pros::delay()", "controller.get_digital()"],
                why: "printf() goes to the terminal. pros::lcd::print() goes to the brain."
            }
        ],

        driver: [
            {
                q: "What is a deadband for?",
                options: ["Ignoring tiny joystick drift", "Making the robot faster", "Reversing a motor", "Saving battery"],
                why: "Small values near 0 are treated as 0 so the robot doesn't creep."
            },
            {
                q: "Left joystick for forward/back and right joystick for turning is which drive style?",
                options: ["Arcade", "Tank", "Hold", "Toggle"],
                why: "Tank uses one joystick per side of the drivetrain."
            },
            {
                q: "In MotorGroup left_mg({-1, -2}), what does the negative sign mean?",
                options: ["Those motors are reversed", "Those ports are disabled", "Those motors are slower", "Nothing"],
                why: "A negative port reverses the motor. This is needed because the left and right sides face opposite ways."
            },
            {
                q: "Which function is best for a toggle since it only triggers once per press?",
                options: ["get_digital_new_press()", "get_digital()", "get_analog()", "move()"],
                why: "get_digital() stays true the whole time you hold the button."
            },
            {
                q: "What does clawClosed = !clawClosed; do?",
                options: ["Flips it between true and false", "Sets it to true", "Sets it to false", "Checks if it's true"],
                why: "The ! means \"not\", so true becomes false and false becomes true."
            }
        ],

        concepts: [
            {
                q: "Why can't we use \"drive forward for 1 second\" in VEX?",
                options: ["Tiles, battery, and motors make it inconsistent", "C++ can't count seconds", "Motors only turn on with PID", "It's against the rules"],
                why: "The same time gives different distances, so we need feedback."
            },
            {
                q: "Which PID term responds to the current error?",
                options: ["Proportional (P)", "Integral (I)", "Derivative (D)", "None of them"],
                why: "P looks at how far you are from the target right now."
            },
            {
                q: "Which term looks at the slope of change and helps reduce overshoot?",
                options: ["Derivative (D)", "Proportional (P)", "Integral (I)", "None of them"],
                why: "D reacts to how fast the error is changing, which dampens the motion."
            },
            {
                q: "The robot oscillates around its target. What should you try?",
                options: ["Decrease kP or increase kD", "Increase kP", "Increase kI a lot", "Set kD to 0"],
                why: "Too much kP overshoots, and kD calms it down."
            },
            {
                q: "What does odometry track?",
                options: ["Position (x, y) and heading", "Battery level", "Motor temperature", "Controller input"],
                why: "LemLib uses the IMU and tracking wheels or encoders to estimate the robot's pose."
            }
        ],

        lemlib: [
            {
                q: "What must you call in initialize() so LemLib works?",
                options: ["chassis.calibrate()", "chassis.setPose()", "chassis.start()", "pros::lcd::initialize()"],
                why: "calibrate() calibrates the IMU and starts odometry."
            },
            {
                q: "What is track width?",
                options: ["The distance between the left and right wheel centers", "The diameter of a wheel", "The length of the robot", "The motor RPM"],
                why: "Wrong measurements here are a common cause of inaccurate autons."
            },
            {
                q: "In LemLib, what does a heading of 90° mean?",
                options: ["Facing right (+X)", "Facing forward (+Y)", "Facing left", "Facing backward"],
                why: "0° is +Y and headings increase clockwise."
            },
            {
                q: "Which motion drives a curved path and ends at a specific angle?",
                options: ["moveToPose()", "moveToPoint()", "turnToHeading()", "setPose()"],
                why: "moveToPose() takes x, y, and a final heading."
            },
            {
                q: "What does {.forwards = false} do?",
                options: ["Makes the motion drive backwards", "Stops the robot", "Limits the speed", "Skips the motion"],
                why: "It's an extra parameter you can add to moves like moveToPoint()."
            },
            {
                q: "After setPose(0, 0, 0), where does moveToPoint(0, 24, 4000) send the robot?",
                options: ["24 inches forward (+Y). 4000 is the timeout in ms", "24 inches right (+X)", "4000 inches forward", "24 inches forward, taking exactly 4 seconds"],
                why: "The last number is only a timeout. The robot stops early if it arrives sooner."
            }
        ]
    };

    function shuffle(arr){
        const a = arr.slice();
        for(let i = a.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function renderQuiz(id){
        const root = document.getElementById("quiz-" + id);
        if(!root) return;

        const questions = QUIZZES[id];
        let correct = 0;

        root.className = "card quiz";
        root.innerHTML = "<h3>Quiz</h3>";

        const score = document.createElement("div");
        score.className = "readout";
        const updateScore = () => {
            score.textContent = "First-try score: " + correct + " / " + questions.length;
        };

        questions.forEach(item => {
            const box = document.createElement("div");
            box.className = "q";

            const prompt = document.createElement("p");
            prompt.textContent = item.q;
            box.appendChild(prompt);

            const explain = document.createElement("div");
            explain.className = "expl";

            let missed = false;
            let finished = false;

            const choices = item.options.map((text, i) => ({text: text, right: i === 0}));

            shuffle(choices).forEach(choice => {
                const btn = document.createElement("button");
                btn.className = "opt";
                btn.textContent = choice.text;

                btn.onclick = () => {
                    if(finished) return;

                    if(choice.right){
                        btn.classList.add("right");
                        finished = true;
                        if(!missed) correct++;
                        explain.textContent = "Correct! " + item.why;
                        updateScore();
                    }else{
                        btn.classList.add("wrong");
                        missed = true;
                        explain.textContent = "Not quite, try again.";
                    }
                };

                box.appendChild(btn);
            });

            box.appendChild(explain);
            root.appendChild(box);
        });

        updateScore();
        root.appendChild(score);
    }

    const BUGS = [
        {
            title: "The robot never calibrates its IMU.",
            code: [
                "void initialize(){",
                "    pros::lcd::initialize();",
                "    chassis.calibrate;",
                "}"
            ],
            bug: 2,
            why: "chassis.calibrate; is missing the parentheses, so the function is never called. It should be chassis.calibrate();"
        },
        {
            title: "Two motors are fighting over a port.",
            code: [
                "pros::Motor intake(1);",
                "pros::Motor lift(2);",
                "pros::Motor claw(2);"
            ],
            bug: [1, 2],
            why: "lift and claw are both on port 2. Every motor needs its own port."
        },
        {
            title: "The code won't build.",
            code: [
                "void opcontrol(){",
                "    pros::Motor motor(1);",
                "",
                "    while(true){",
                "        motor.move_velocity(200)",
                "        pros::delay(20);",
                "    }",
                "}"
            ],
            bug: 4,
            why: "The move_velocity line is missing its semicolon."
        },
        {
            title: "The claw flickers open and closed when you press A.",
            code: [
                "bool clawClosed = false;",
                "",
                "while(true){",
                "    if(controller.get_digital(pros::E_CONTROLLER_DIGITAL_A)){",
                "        clawClosed = !clawClosed;",
                "        claw.set_value(clawClosed);",
                "    }",
                "    pros::delay(20);",
                "}"
            ],
            bug: 3,
            why: "get_digital() is true for as long as you hold the button, so the claw flips every 20 ms. A toggle needs get_digital_new_press()."
        },
        {
            title: "The robot only moves when the joystick is barely touched.",
            code: [
                "int forward = controller.get_analog(pros::E_CONTROLLER_ANALOG_LEFT_Y);",
                "",
                "if(abs(forward) > 5) forward = 0;",
                "",
                "left_mg.move(forward);",
                "right_mg.move(forward);"
            ],
            bug: 2,
            why: "The comparison is backwards. A deadband should zero out SMALL values, so it should be abs(forward) < 5."
        },
        {
            title: "The robot should end facing right, but it ends up facing backwards.",
            code: [
                "chassis.setPose(0, 0, 0);",
                "chassis.moveToPoint(0, 24, 4000);",
                "chassis.turnToHeading(180, 2000);   // face right"
            ],
            bug: 2,
            why: "90° is right in LemLib. 180° is backwards."
        },
        {
            title: "The robot turns when you push forward, and drives when you turn.",
            code: [
                "int leftY  = controller.get_analog(pros::E_CONTROLLER_ANALOG_LEFT_Y);",
                "int rightX = controller.get_analog(pros::E_CONTROLLER_ANALOG_RIGHT_X);",
                "chassis.arcade(rightX, leftY);"
            ],
            bug: 2,
            why: "The arguments are swapped. arcade() takes the forward/back value first and the turn value second: chassis.arcade(leftY, rightX);"
        }
    ];

    let bugIndex = 0;

    function renderBug(){
        const puzzle = BUGS[bugIndex];
        const result = document.getElementById("bugResult");
        const box = document.getElementById("bugCode");
        const answers = [].concat(puzzle.bug);
        let solved = false;

        document.getElementById("bugTitle").textContent = "Puzzle " + (bugIndex + 1) + " of " + BUGS.length + ": " + puzzle.title;
        result.textContent = "";
        box.innerHTML = "";

        puzzle.code.forEach((line, i) => {
            const row = document.createElement("div");
            row.className = "bugline";
            row.textContent = line;

            row.onclick = () => {
                if(solved) return;

                if(answers.includes(i)){
                    row.classList.add("right");
                    solved = true;
                    result.textContent = "Found it! " + puzzle.why;
                }else{
                    row.classList.add("wrong");
                    result.textContent = "That line is fine. Look again.";
                }
            };

            box.appendChild(row);
        });
    }

    document.getElementById("bugNext").addEventListener("click", () => {
        bugIndex = (bugIndex + 1) % BUGS.length;
        renderBug();
    });

    const FILL_INS = [
        {
            pre: "chassis.",
            answer: ["calibrate"],
            post: "();     // in initialize()",
            hint: "It calibrates the IMU and starts odometry."
        },
        {
            pre: "chassis.setPose(0, 0, ",
            answer: ["0"],
            post: ");     // start facing +Y",
            hint: "Heading 0° points along +Y."
        },
        {
            pre: "chassis.",
            answer: ["turnToHeading"],
            post: "(90, 2000);     // turn in place to face right",
            hint: "It turns in place to a specific heading."
        },
        {
            pre: "chassis.moveToPoint(0, 0, 4000, {.",
            answer: ["forwards"],
            post: " = false});     // drive backwards",
            hint: "It's the option that sets the direction."
        },
        {
            pre: "pros::",
            answer: ["delay"],
            post: "(20);     // wait 20 ms",
            hint: "It gives the brain time to run other tasks."
        },
        {
            pre: "if(controller.",
            answer: ["get_digital_new_press"],
            post: "(pros::E_CONTROLLER_DIGITAL_A)){     // runs once per press",
            hint: "This is the one you use for toggles."
        },
        {
            pre: "left_mg.move(forward ",
            answer: ["+"],
            post: " turning);     // arcade drive, left side",
            hint: "The left side adds the turn. The right side subtracts it."
        }
    ];

    function renderFillIns(){
        const area = document.getElementById("fibArea");
        if(!area) return;

        FILL_INS.forEach(item => {
            const row = document.createElement("div");
            row.className = "fib";

            const pre = document.createElement("span");
            pre.textContent = item.pre;

            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "";
            input.spellcheck = false;
            const longest = Math.max(...item.answer.map(a => a.length), 3);
            input.style.width = "calc(" + longest + "ch + 28px)";

            const post = document.createElement("span");
            post.textContent = item.post;

            const check = document.createElement("button");
            check.textContent = "Check";

            const feedback = document.createElement("span");
            feedback.className = "fb";

            const grade = () => {
                if(item.answer.includes(input.value.trim())){
                    feedback.className = "fb success";
                    feedback.textContent = "Correct!";
                }else{
                    feedback.className = "fb error";
                    feedback.textContent = "Not quite. Hint: " + item.hint;
                }
            };

            check.onclick = grade;
            input.addEventListener("keydown", e => {
                if(e.key === "Enter") grade();
            });

            row.append(pre, input, post, check, feedback);
            area.appendChild(row);
        });
    }

    window.addEventListener("hashchange", showPage);

    Object.keys(QUIZZES).forEach(renderQuiz);
    renderBug();
    renderFillIns();
    addFooters();
    showPage();
})();