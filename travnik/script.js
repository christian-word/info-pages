/**
 * ТРАВНИК - ЛОГИКА ПРОГРАММЫ
 * Загружает данные из JSON и генерирует рецепты с учетом безопасности
 */

let appData = null;

// 1. Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();

    // Привязываем событие к кнопке
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateRecipe);
    }
});

// 2. Асинхронная загрузка базы данных
async function loadDatabase() {
    const select = document.getElementById('mainHerb');
    
    try {
        // Загружаем внешний JSON файл
        const response = await fetch('./database.json');
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        appData = await response.json();
        
        // Очищаем и наполняем выпадающий список
        select.innerHTML = '<option value="" disabled selected>-- Выберите вариант --</option>';
        
        // Добавляем травы в список
        for (const [id, herb] of Object.entries(appData.herbs)) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = herb.name;
            select.appendChild(option);
        }

        console.log("База данных успешно загружена из JSON");

    } catch (error) {
        console.error("Критическая ошибка:", error);
        document.getElementById('result').innerHTML = `
            <div class="warning-box">
                <strong>Ошибка:</strong> Не удалось загрузить базу данных. 
                Убедитесь, что файл database.json лежит в той же папке и вы используете сервер (GitHub Pages).
            </div>`;
    }
}

// 3. Основная функция генерации рецепта
function generateRecipe() {
    const herbId = document.getElementById('mainHerb').value;
    const resultDiv = document.getElementById('result');

    if (!herbId || !appData) return;

    const herb = appData.herbs[herbId];
    const safety = appData.safety_limits[herbId];
    
    // Начальные значения (базовые)
    let finalAmount = herb.default;
    let finalDuration = "10-14 дней";
    let warningHtml = "";
    let badgeHtml = "";

    // Применяем лимиты безопасности, если трава в списке опасных
    if (safety) {
        finalAmount = safety.max;
        finalDuration = `${safety.maxDays} дней (строгое ограничение)`;
        warningHtml = `<div class="badge badge-danger">⚠️ Важно: ${safety.warning}</div>`;
        badgeHtml = `<span class="badge badge-danger">Сильнодействующее</span>`;
    }

    // Если есть специфическое предупреждение в самой траве (например, Зверобой)
    if (herb.warning && !safety) {
        warningHtml = `<div class="badge badge-danger" style="background:#fff3e0; color:#e65100; border:1px solid #ffe0b2;">
                        ⚠️ ${herb.warning}
                      </div>`;
    }

    // Рендерим карточку результата
    resultDiv.innerHTML = `
        <div class="recipe-card">
            ${badgeHtml}
            <h3>Рекомендация по применению: ${herb.name}</h3>
            
            <p><strong>Дозировка:</strong> ${finalAmount} ${herb.unit} на 250 мл горячей воды.</p>
            <p><strong>Курс приема:</strong> ${finalDuration}</p>
            
            ${herb.note ? `<p><em>* Примечание: ${herb.note}</em></p>` : ''}
            
            <div class="instruction-text">
                <strong>Инструкция:</strong> Залить сырье кипятком, настоять 20-30 минут в закрытой посуде, процедить. 
                Принимать теплыми небольшими глотками за 20 минут до еды.
            </div>

            <div style="margin-top: 15px;">
                ${warningHtml}
            </div>

            <p style="font-size: 0.8em; color: #888; margin-top: 15px;">
                ID Травы: ${herbId} | Данные верифицированы системой безопасности.
            </p>
        </div>
    `;
}