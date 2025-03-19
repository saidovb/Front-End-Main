// Barcha tugmalar va ekran elementini olish
const buttons = document.querySelectorAll('.button');
const display = document.getElementById('display');

// Yordamchi funksiyalar
function checkLength() {
    return display.innerText.replace(/\n/g, '').length >= 17;
}

function isLastCharOperator() {
    const operators = ['%', '/', '*', '-', '+'];
    return operators.includes(display.innerText.slice(-1));
}

function countChar(str, char) {
    return (str.match(new RegExp(`\\${char}`, 'g')) || []).length;
}


function updateDisplay(value) {
    const lines = value.split('\n');
    display.innerHTML = lines.join('<br>');
    display.style.lineHeight = lines.length === 1 ? "3em" : "1em";
     // Markazlashtirish
}

// Tugmalar bosilganda ishlaydigan funksiya
function inputHandler(value) {
    let text = display.innerText.replace(/\n/g, ''); // Avval yangi qatorlarni olib tashlash

    if (text === '0' && !isNaN(value) && value !== '.') {
        text = value;
    } else {
        if (checkLength()) {
            text += '\n'; // 17 ta belgi bo‘lsa yangi qatordan yozish
        }

        if (isLastCharOperator() && ['%', '/', '*', '-', '+'].includes(value)) {
            return;
        }

        // Qavslarni to'g'ri qo'shish
        if (value === '(') {
            if (!text.endsWith('(') && !text.endsWith(')')) {
                text += '(';
            }
        } else if (value === ')') {
            let openCount = countChar(text, '(');
            let closeCount = countChar(text, ')');
            if (openCount > closeCount) {
                text += ')';
            }
        } else if (value === '.') {
            let lastNumber = text.split(/[\+\-\*\/\(\)]/).pop();
            if (!lastNumber.includes('.')) {
                text += '.';
            }
        } else {
            switch (value) {
                case '=':
                    try {
                        let result = eval(text.replace(/\n/g, ''));
                        if (!isFinite(result) || result === undefined) throw new Error("Invalid calculation");
                        text = String(result);
                    } catch {
                        text = 'error';
                        setTimeout(() => {
                            text = '0';
                            updateDisplay(text);
                        }, 500);
                    }
                    break;

                case 'Delete':
                    text = text.slice(0, -1) || '0';
                    break;

                case 'C':
                    text = '0';
                    break;

                default:
                    text += value;
                    break;
            }
        }
    }

    updateDisplay(text);
}

// Tugmalar bosilishida ishlaydigan hodisalar
buttons.forEach(button => {
    button.addEventListener('click', () => {
        let value = button.innerText;
        if (button.id === 'del-button') {
            value = 'Delete';
        }
        inputHandler(value);
    });
});

// Klaviatura tugmalari uchun hodisa qoʻshish
document.addEventListener('keydown', (event) => {
    const key = event.key;
    const validKeys = '0123456789+-*/.()';
    if (validKeys.includes(key)) {
        inputHandler(key);
    } else if (key === 'Enter') {
        inputHandler('=');
    } else if (key === 'Backspace' || key === 'Delete') {
        inputHandler('Delete');
    }
});

// Ekranni 0 bilan boshlash
display.innerText = '0';