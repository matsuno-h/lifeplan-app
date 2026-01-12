// ローカルストレージキー
const STORAGE_KEY = 'life_plan_simulator_data';

// グローバル変数（初期値設定）
let appData = {
    userSettings: {
        user_name: '',
        birth_date: '', // YYYY-MM-DD
        gender: 'male',
        disability: 'none',
        life_expectancy: 85,
        retirement_age: 65,
        current_savings: 300,
        yearly_income: 400,
        yearly_expenses: 250,
        income_growth_rate: 1.0
    },
    incomes: [],
    expenses: [],
    lifeEvents: [],
    familyMembers: [],
    insurances: [],
    pensions: [],
    educationFunds: [],
    housings: [],
    assets: [],
    realEstates: [],
    loans: [],
    goals: {
        q1: '',
        q2: '',
        q3: '',
        q4: ''
    }
};

let chartInstance = null;

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initEditFeatures(); // 編集機能の初期化
    setupEventListeners();
    
    // 初期表示時は詳細タブの内容を隠すなどの処理はHTML側でクラス制御済み
    switchTab('goals'); // 目標設定タブをデフォルトにする
});

// タブ切り替え
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active-tab', 'text-blue-600', 'border-b-2', 'border-blue-600');
        el.classList.add('text-gray-500');
    });

    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    const btn = document.getElementById(`tab-${tabName}`);
    btn.classList.add('active-tab', 'text-blue-600', 'border-b-2', 'border-blue-600');
    btn.classList.remove('text-gray-500');
};

// 住宅フォーム切り替え
window.toggleHousingForm = function() {
    const type = document.querySelector('input[name="housing_type"]:checked').value;
    const rentalFields = document.getElementById('housing-rental-fields');
    const ownedFields = document.getElementById('housing-owned-fields');
    
    if (type === 'rental') {
        rentalFields.classList.remove('hidden');
        ownedFields.classList.add('hidden');
    } else {
        rentalFields.classList.add('hidden');
        ownedFields.classList.remove('hidden');
    }
};

// 編集機能のUI初期化（DOM操作で必要な要素を追加）
function initEditFeatures() {
    const forms = [
        'event-form', 'family-form', 'insurance-form', 'pension-form', 'asset-form', 'education-form', 'income-form',
        'housing-form', 'realestate-form', 'loan-form', 'expense-form', 'goals-form'
    ];

    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (!form) return;

        // 編集用IDフィールドの追加
        if (!form.querySelector('input[name="edit_id"]')) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'edit_id';
            form.prepend(hiddenInput);
        }

        // ボタンエリアの改修
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && !form.querySelector('.cancel-btn')) {
            // ボタンをラップするコンテナを作成
            const btnContainer = document.createElement('div');
            btnContainer.className = 'flex space-x-2 mt-2'; // マージン調整
            
            // 既存のボタンを移動
            submitBtn.parentNode.insertBefore(btnContainer, submitBtn);
            btnContainer.appendChild(submitBtn);
            
            // クラス調整 (w-full -> flex-1)
            submitBtn.classList.remove('w-full', 'mt-1', 'mt-2'); // 既存のマージンも除去
            submitBtn.classList.add('flex-1');

            // 中止ボタン作成
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'hidden flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm cancel-btn transition duration-200';
            cancelBtn.textContent = '中止';
            cancelBtn.onclick = () => cancelEdit(formId);
            
            btnContainer.appendChild(cancelBtn);
        }
    });
}

// イベントリスナー設定
function setupEventListeners() {
    document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
    document.getElementById('event-form').addEventListener('submit', handleEventSubmit);
    
    // 汎用サブミットハンドラの使用
    document.getElementById('income-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'incomes', renderIncomeList));
    document.getElementById('family-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'familyMembers', renderFamilyList));
    document.getElementById('expense-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'expenses', renderExpenseList));
    document.getElementById('education-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'educationFunds', renderEducationList));
    document.getElementById('insurance-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'insurances', renderInsuranceList));
    document.getElementById('pension-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'pensions', renderPensionList));
    document.getElementById('housing-form').addEventListener('submit', handleHousingSubmit);
    document.getElementById('asset-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'assets', renderAssetList));
    document.getElementById('realestate-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'realEstates', renderRealEstateList));
    document.getElementById('loan-form').addEventListener('submit', (e) => handleSimpleSubmit(e, 'loans', renderLoanList));
    
    // データ管理ボタン
    document.getElementById('download-csv').addEventListener('click', downloadCSV);
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('change', importData);
    document.getElementById('clear-data').addEventListener('click', clearData);
    
    // アドバイスボタン
    const adviceBtn = document.getElementById('generate-advice-btn');
    if (adviceBtn) {
        adviceBtn.addEventListener('click', generateAdvice);
    }

    // 目標設定フォーム
    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) {
        goalsForm.addEventListener('submit', handleGoalsSubmit);
    }
}

// データ読み込み (LocalStorage)
function loadData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData);
            // 既存のappData構造にマージ
            appData = { ...appData, ...parsedData };
            
            // データマイグレーション: yearly_income (単一) -> incomes (配列)
            if (appData.userSettings.yearly_income !== undefined && (!appData.incomes || appData.incomes.length === 0)) {
                // 初期データがない場合は配列初期化
                if (!appData.incomes) appData.incomes = [];
                
                // 現在年齢を計算 (概算)
                let currentAge = 30;
                if (appData.userSettings.birth_date) {
                    const year = new Date(appData.userSettings.birth_date).getFullYear();
                    currentAge = new Date().getFullYear() - year;
                }
                
                appData.incomes.push({
                    id: generateId(),
                    name: '給与収入',
                    start_age: currentAge,
                    end_age: appData.userSettings.retirement_age || 65,
                    amount: appData.userSettings.yearly_income,
                    growth_rate: appData.userSettings.income_growth_rate || 0
                });
            }

            // データマイグレーション: yearly_expenses (単一) -> expenses (配列)
            if (appData.userSettings.yearly_expenses !== undefined && (!appData.expenses || appData.expenses.length === 0)) {
                if (!appData.expenses) appData.expenses = [];
                
                // 現在年齢から95歳までをデフォルト期間とする
                let currentAge = 30;
                if (appData.userSettings.birth_date) {
                    const year = new Date(appData.userSettings.birth_date).getFullYear();
                    currentAge = new Date().getFullYear() - year;
                }

                appData.expenses.push({
                    id: generateId(),
                    name: '基本生活費',
                    start_age: currentAge,
                    end_age: 95,
                    amount: appData.userSettings.yearly_expenses
                });
            }
            // データマイグレーション: monthly_contribution -> yearly_contribution
            if (appData.assets) {
                appData.assets.forEach(asset => {
                    if (asset.monthly_contribution !== undefined && asset.yearly_contribution === undefined) {
                        asset.yearly_contribution = asset.monthly_contribution * 12;
                        delete asset.monthly_contribution;
                    }
                });
            }

            // 初期値補完
            if (!appData.userSettings) {
                 appData.userSettings = {
                    user_name: '未設定',
                    birth_date: new Date(new Date().getFullYear() - 30, 0, 1).toISOString().split('T')[0], // 30歳相当
                    gender: 'male',
                    disability: 'none',
                    life_expectancy: 85,
                    retirement_age: 65,
                    current_savings: 300,
                    yearly_income: 400,
                    yearly_expenses: 250,
                    income_growth_rate: 1.0
                };
            }
            
            // データマイグレーション: current_age -> birth_date
            if (appData.userSettings.current_age !== undefined && !appData.userSettings.birth_date) {
                const age = appData.userSettings.current_age;
                const year = new Date().getFullYear() - age;
                appData.userSettings.birth_date = `${year}-01-01`;
                appData.userSettings.user_name = '本人';
                appData.userSettings.gender = 'male';
                appData.userSettings.disability = 'none';
                appData.userSettings.life_expectancy = 85;
                delete appData.userSettings.current_age;
            }
        } catch (e) {
            console.error('Failed to parse stored data', e);
        }
    }
    
    // 画面への反映
    fillSettingsForm(appData.userSettings);
    if (!appData.goals) appData.goals = { q1: '', q2: '', q3: '', q4: '' };
    fillGoalsForm(appData.goals);
    renderAllLists();
    calculateAndRender();
}

// データ保存 (LocalStorage)
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    showSaveStatus();
}

function showSaveStatus() {
    const el = document.getElementById('save-status');
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 3000);
}

// フォームへの値設定
function fillSettingsForm(settings) {
    if (!settings) return;
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('user_name', settings.user_name || '');
    setVal('birth_date', settings.birth_date || '');
    setVal('gender', settings.gender || 'male');
    setVal('disability', settings.disability || 'none');
    setVal('life_expectancy', settings.life_expectancy || 85);
    
    setVal('retirement_age', settings.retirement_age);
    setVal('current_savings', settings.current_savings);
    
    // document.getElementById('yearly_income').value = settings.yearly_income; // 廃止
    // document.getElementById('yearly_expenses').value = settings.yearly_expenses; // 廃止
    // document.getElementById('income_growth_rate').value = settings.income_growth_rate; // 廃止
}

// 目標設定フォームへの値設定
function fillGoalsForm(goals) {
    if (!goals) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    setVal('goal_q1', goals.q1 || '');
    setVal('goal_q2', goals.q2 || '');
    setVal('goal_q3', goals.q3 || '');
    setVal('goal_q4', goals.q4 || '');
}

// 目標設定保存処理
function handleGoalsSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    appData.goals = {
        q1: formData.get('q1'),
        q2: formData.get('q2'),
        q3: formData.get('q3'),
        q4: formData.get('q4')
    };
    saveData();
}

// ID生成 (簡易UUID)
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 編集モード開始
window.editItem = function(id, dataKey, formId) {
    const item = appData[dataKey].find(i => i.id === id);
    if (!item) return;

    const form = document.getElementById(formId);
    if (!form) return;

    // フォームのリセット（前の入力をクリア）
    form.reset();

    // 編集IDセット
    if(form.elements['edit_id']) form.elements['edit_id'].value = id;

    // 値のセット (name属性が一致するフィールドに値をセット)
    // マッピングが複雑なものは個別に処理する必要があるが、
    // 基本的には name="hoge" と item.hoge が一致するように設計している
    // ただし、prefixがついているもの (ins_name -> item.name) は変換が必要
    
    for (const key in item) {
        // 通常のキーマッチ
        if (form.elements[key]) {
            form.elements[key].value = item[key];
        }
        
        // プレフィックス対応 (例: ins_name, loan_balance)
        // データキーからプレフィックスを探すのは難しいので、
        // フォームの各要素を見て、データを探す方が確実
    }

    // フォーム要素ベースでデータを探してセット
    Array.from(form.elements).forEach(el => {
        if (!el.name || el.type === 'submit' || el.type === 'hidden') return;
        
        // データキーとのマッピングロジック
        let dataKeyName = el.name;
        
        // プレフィックス除去ロジック (簡易版)
        if (dataKey === 'insurances') {
            if (el.name.startsWith('ins_')) dataKeyName = el.name.replace('ins_', '');
        } else if (dataKey === 'educationFunds') {
            if (el.name.startsWith('education_')) dataKeyName = el.name.replace('education_', '');
        } else if (dataKey === 'pensions') {
            if (el.name.startsWith('pension_')) dataKeyName = el.name.replace('pension_', '');
        } else if (dataKey === 'incomes') {
            if (el.name.startsWith('income_')) dataKeyName = el.name.replace('income_', '');
        } else if (dataKey === 'expenses') {
            if (el.name.startsWith('expense_')) dataKeyName = el.name.replace('expense_', '');
        } else if (dataKey === 'assets') {
            if (el.name.startsWith('asset_')) dataKeyName = el.name.replace('asset_', '');
            if (el.name === 'asset_yearly') dataKeyName = 'yearly_contribution';
            if (el.name === 'asset_withdrawal_age') dataKeyName = 'withdrawal_age';
            if (el.name === 'asset_withdrawal_amount') dataKeyName = 'withdrawal_amount';
        } else if (dataKey === 'realEstates') {
            if (el.name.startsWith('re_')) dataKeyName = el.name.replace('re_', '');
            if (el.name === 're_price') dataKeyName = 'purchase_price';
            if (el.name === 're_value') dataKeyName = 'current_value';
            // 新規項目マッピング
            if (el.name === 're_initial_cost') dataKeyName = 'initial_cost';
            if (el.name === 're_loan_amount') dataKeyName = 'loan_amount';
            if (el.name === 're_loan_rate') dataKeyName = 'loan_rate';
            if (el.name === 're_loan_payments') dataKeyName = 'loan_payments';
            if (el.name === 're_rent_income') dataKeyName = 'rent_income';
            if (el.name === 're_maintenance_cost') dataKeyName = 'maintenance_cost';
            // 売却・税金
            if (el.name === 're_tax') dataKeyName = 'tax';
            if (el.name === 're_sell_date') dataKeyName = 'sell_date';
            if (el.name === 're_sell_price') dataKeyName = 'sell_price';
            if (el.name === 're_sell_cost') dataKeyName = 'sell_cost';
        } else if (dataKey === 'loans') {
            if (el.name.startsWith('loan_')) dataKeyName = el.name.replace('loan_', '');
            if (el.name === 'loan_monthly') dataKeyName = 'monthly_payment';
            if (el.name === 'loan_remaining') dataKeyName = 'remaining_payments';
        } else if (dataKey === 'familyMembers') {
            if (el.name.startsWith('family_')) dataKeyName = el.name.replace('family_', '');
        } else if (dataKey === 'housings') {
            // housingは構造がフラットで保存されているのでそのままname属性でマッチする場合が多いが
            // typeによる分岐などがあるため注意
            if (el.name.startsWith('housing_')) dataKeyName = el.name.replace('housing_', '');
            // rental_, owned_ プレフィックスもデータプロパティと一致させているか確認
            // handleHousingSubmitで展開して保存している: rent, initial, loan_balance など
            if (el.name.startsWith('rental_')) dataKeyName = el.name.replace('rental_', '');
            if (el.name.startsWith('owned_')) dataKeyName = el.name.replace('owned_', '');
        } 

        // 値セット
        if (item[dataKeyName] !== undefined && item[dataKeyName] !== null) {
            el.value = item[dataKeyName];
        }
        
        // ラジオボタン対応 (housing_type)
        if (el.type === 'radio' && el.name === 'housing_type') {
            el.checked = (el.value === item.type);
            // フォーム切り替え発火
            if (el.checked && window.toggleHousingForm) window.toggleHousingForm();
        }
    });

    // UI変更
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = '更新';
    const cancelBtn = form.querySelector('.cancel-btn');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    
    // スクロール
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// 編集キャンセル
window.cancelEdit = function(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.reset();
    if(form.elements['edit_id']) form.elements['edit_id'].value = '';
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = '追加'; // デフォルト文言に戻す（詳細毎に変えるのは手間なので一旦「追加」等で統一、あるいはdata属性で持つか）
    // 文言の微調整
    if (formId === 'event-form') submitBtn.textContent = 'イベントを追加';
    else if (formId === 'settings-form') submitBtn.textContent = '設定を保存して計算';
    else submitBtn.textContent = '追加';

    const cancelBtn = form.querySelector('.cancel-btn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    
    // Housing固有リセット
    if (formId === 'housing-form' && window.toggleHousingForm) {
        document.querySelector('input[name="housing_type"][value="rental"]').checked = true;
        window.toggleHousingForm();
    }
};

// 設定保存処理
function handleSettingsSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    appData.userSettings = {
        user_name: formData.get('user_name'),
        birth_date: formData.get('birth_date'),
        gender: formData.get('gender'),
        disability: formData.get('disability'),
        life_expectancy: parseInt(formData.get('life_expectancy')) || 85,
        retirement_age: parseInt(formData.get('retirement_age')),
        current_savings: parseInt(formData.get('current_savings')),
        // yearly_income: parseInt(formData.get('yearly_income')),
        yearly_expenses: parseInt(formData.get('yearly_expenses')),
        // income_growth_rate: parseFloat(formData.get('income_growth_rate'))
    };

    // 本人情報をfamilyMembersに同期
    updateSelfInFamilyMembers();

    saveData();
    // 家族リストの再描画も必要（本人の名前などが変わるため）
    renderFamilyList();
    calculateAndRender();
}

// familyMembers内の「本人」データをuserSettingsと同期する
function updateSelfInFamilyMembers() {
    const settings = appData.userSettings;
    const selfData = {
        id: 'self_user', // 固定ID
        name: settings.user_name,
        relation: 'self',
        birth_date: settings.birth_date,
        birth_year: new Date(settings.birth_date).getFullYear(),
        gender: settings.gender,
        disability: settings.disability,
        life_expectancy: settings.life_expectancy
    };

    // 既存の本人を探す
    const selfIndex = appData.familyMembers.findIndex(m => m.relation === 'self');
    
    if (selfIndex > -1) {
        // 更新 (IDは既存のものがあればそれを優先するか、固定IDにするか。ここでは固定IDで上書き)
        appData.familyMembers[selfIndex] = { ...appData.familyMembers[selfIndex], ...selfData };
    } else {
        // 先頭に追加
        appData.familyMembers.unshift(selfData);
    }
}

// イベント追加/更新処理
function handleEventSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const editId = formData.get('edit_id');
    
    const eventData = {
        event_name: formData.get('event_name'),
        age: parseInt(formData.get('event_age')),
        cost: parseInt(formData.get('event_cost')),
        description: ''
    };

    if (editId) {
        // 更新
        const index = appData.lifeEvents.findIndex(i => i.id === editId);
        if (index > -1) {
            appData.lifeEvents[index] = { ...appData.lifeEvents[index], ...eventData };
        }
        cancelEdit('event-form'); // UIリセット
    } else {
        // 新規
        eventData.id = generateId();
        appData.lifeEvents.push(eventData);
        e.target.reset();
    }

    appData.lifeEvents.sort((a, b) => a.age - b.age); // 年齢順 (削除: 手動ソート可能にするため)
    // ソートを無効化し、手動ソートを可能にする。ただし、初期登録時などに年齢順で見たい需要はあるかもしれないが
    // ユーザー要望「並べ替えができるように」を優先し、自動ソートは行わない。
    // appData.lifeEvents.sort((a, b) => a.age - b.age); 
    saveData();
    renderEventList();
    calculateAndRender();
}

// 住宅追加/更新処理
function handleHousingSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const editId = formData.get('edit_id');
    const type = formData.get('housing_type');
    
    const housingData = {
        type: type,
        name: formData.get('housing_name'),
        start_age: parseInt(formData.get('housing_start_age')),
        end_age: parseInt(formData.get('housing_end_age')) || 99
    };
    
    if (type === 'rental') {
        housingData.rent = parseInt(formData.get('rental_rent')) || 0;
        housingData.initial = parseInt(formData.get('rental_initial')) || 0;
        housingData.renewal_cost = parseInt(formData.get('rental_renewal_cost')) || 0;
        housingData.renewal_interval = parseInt(formData.get('rental_interval')) || 2;
        // 不要データのクリア
        housingData.loan_balance = 0; housingData.loan_monthly = 0; housingData.loan_end_age = 0; housingData.tax = 0; housingData.maintenance_cost = 0;
    } else {
        housingData.loan_balance = parseInt(formData.get('owned_loan_balance')) || 0;
        housingData.loan_monthly = parseInt(formData.get('owned_loan_monthly')) || 0;
        housingData.loan_end_age = parseInt(formData.get('owned_loan_end_age')) || 0;
        housingData.tax = parseInt(formData.get('owned_tax')) || 0;
        housingData.maintenance_cost = parseInt(formData.get('owned_maintenance')) || 0;
        // 不要データのクリア
        housingData.rent = 0; housingData.initial = 0; housingData.renewal_cost = 0; housingData.renewal_interval = 0;
    }
    
    if (editId) {
        const index = appData.housings.findIndex(i => i.id === editId);
        if (index > -1) {
            appData.housings[index] = { ...appData.housings[index], ...housingData };
        }
        cancelEdit('housing-form');
    } else {
        housingData.id = generateId();
        if (!appData.housings) appData.housings = [];
        appData.housings.push(housingData);
        e.target.reset();
        document.querySelector('input[name="housing_type"][value="rental"]').checked = true;
        toggleHousingForm();
    }

    // appData.housings.sort((a, b) => a.start_age - b.start_age); // 自動ソート削除
    saveData();
    renderHousingList();
    calculateAndRender();
}

// 汎用データ追加/更新処理
function handleSimpleSubmit(e, dataKey, renderFunc) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const editId = formData.get('edit_id');
    const newData = {};
    
    // データ構築
    if (dataKey === 'incomes') {
        newData.name = formData.get('income_name');
        newData.start_age = parseInt(formData.get('income_start_age'));
        newData.end_age = parseInt(formData.get('income_end_age'));
        newData.amount = parseInt(formData.get('income_amount'));
        newData.growth_rate = parseFloat(formData.get('income_growth_rate') || 0);
    } else if (dataKey === 'expenses') {
        newData.name = formData.get('expense_name');
        newData.start_age = parseInt(formData.get('expense_start_age'));
        newData.end_age = parseInt(formData.get('expense_end_age'));
        newData.amount = parseInt(formData.get('expense_amount'));
        newData.inflation_rate = parseFloat(formData.get('expense_inflation_rate') || 0);
    } else if (dataKey === 'familyMembers') {
        newData.name = formData.get('family_name');
        newData.relation = formData.get('family_relation');
        const birthDateStr = formData.get('family_birth_date');
        if (birthDateStr) {
            newData.birth_date = birthDateStr;
            newData.birth_year = new Date(birthDateStr).getFullYear();
        } else {
             newData.birth_year = parseInt(formData.get('family_birth')) || new Date().getFullYear();
        }
        newData.gender = formData.get('family_gender');
        newData.disability = formData.get('family_disability');
        newData.life_expectancy = parseInt(formData.get('family_life_expectancy')) || null;

    } else if (dataKey === 'educationFunds') {
        newData.owner_id = formData.get('education_owner_id');
        newData.name = formData.get('education_name');
        newData.start_age = parseInt(formData.get('education_start_age'));
        newData.end_age = parseInt(formData.get('education_end_age'));
        newData.amount = parseInt(formData.get('education_amount'));
    } else if (dataKey === 'insurances') {
        newData.company = formData.get('ins_company');
        newData.name = formData.get('ins_name');
        newData.period = parseInt(formData.get('ins_period'));
        newData.yearly_premium = parseInt(formData.get('ins_premium'));
        newData.surrender_age = parseInt(formData.get('ins_surrender_age'));
        newData.surrender_amount = parseInt(formData.get('ins_surrender_amount'));
    } else if (dataKey === 'pensions') {
        newData.owner_id = formData.get('pension_owner_id');
        newData.name = formData.get('pension_name');
        newData.start_age = parseInt(formData.get('pension_start_age'));
        newData.amount = parseInt(formData.get('pension_amount'));
    } else if (dataKey === 'assets') {
        newData.name = formData.get('asset_name');
        newData.asset_type = formData.get('asset_type');
        newData.amount = parseInt(formData.get('asset_amount'));
        newData.return_rate = parseFloat(formData.get('asset_return') || 0);
        newData.yearly_contribution = parseInt(formData.get('asset_yearly')) || 0;
        newData.end_age = parseInt(formData.get('asset_end_age')) || null;
        newData.withdrawal_age = parseInt(formData.get('asset_withdrawal_age')) || null;
        newData.withdrawal_amount = parseInt(formData.get('asset_withdrawal_amount')) || 0;
    } else if (dataKey === 'realEstates') {
        newData.name = formData.get('re_name');
        newData.purchase_date = formData.get('re_purchase_date');
        newData.purchase_price = parseInt(formData.get('re_price') || 0);
        newData.initial_cost = parseInt(formData.get('re_initial_cost') || 0);
        newData.loan_amount = parseInt(formData.get('re_loan_amount') || 0);
        newData.loan_rate = parseFloat(formData.get('re_loan_rate') || 0);
        newData.loan_payments = parseInt(formData.get('re_loan_payments') || 0);
        newData.rent_income = parseInt(formData.get('re_rent_income') || 0);
        newData.maintenance_cost = parseInt(formData.get('re_maintenance_cost') || 0);
        
        newData.tax = parseInt(formData.get('re_tax') || 0);
        newData.sell_date = formData.get('re_sell_date');
        newData.sell_price = parseInt(formData.get('re_sell_price') || 0);
        newData.sell_cost = parseInt(formData.get('re_sell_cost') || 0);

        // current_value は購入直後は purchase_price と仮定、あるいはフォームにあれば使う
        // フォームには re_value (現在価値) があるが、新規投資の場合は purchase_price がベース
        newData.current_value = parseInt(formData.get('re_value') || newData.purchase_price);
    } else if (dataKey === 'loans') {
        newData.name = formData.get('loan_name');
        newData.balance = parseInt(formData.get('loan_balance'));
        newData.monthly_payment = parseFloat(formData.get('loan_monthly'));
        newData.remaining_payments = parseInt(formData.get('loan_remaining'));
    }

    if (editId) {
        const index = appData[dataKey].findIndex(i => i.id === editId);
        if (index > -1) {
            appData[dataKey][index] = { ...appData[dataKey][index], ...newData };
        }
        cancelEdit(e.target.id);
    } else {
        newData.id = generateId();
        appData[dataKey].push(newData);
        e.target.reset();
    }

    saveData();
    renderFunc();
    calculateAndRender();
}

// 汎用データ削除処理
window.deleteItem = function(id, dataKey, renderFunc) {
    if (!confirm('削除してもよろしいですか？')) return;
    
    appData[dataKey] = appData[dataKey].filter(item => item.id !== id);
    
    // 編集中のアイテムを削除した場合、フォームをリセットするか？
    // 簡易的にリセットはしないが、edit_idが一致するならリセットすべき
    
    saveData();
    if (typeof renderFunc === 'function') {
        renderFunc();
    } else if (typeof window[renderFunc] === 'function') {
        window[renderFunc]();
    }
    calculateAndRender();
};

// アイテム移動処理
window.moveItem = function(id, dataKey, direction, renderFunc) {
    const list = appData[dataKey];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;

    // 要素の入れ替え
    [list[index], list[newIndex]] = [list[newIndex], list[index]];

    saveData();
    if (typeof renderFunc === 'function') {
        renderFunc();
    } else if (typeof window[renderFunc] === 'function') {
        window[renderFunc]();
    }
    calculateAndRender();
};

// 全リスト描画
function renderAllLists() {
    renderIncomeList();
    renderExpenseList();
    renderEventList();
    renderHousingList();
    renderFamilyList();
    renderEducationList();
    renderInsuranceList();
    renderPensionList();
    renderAssetList();
    renderRealEstateList();
    renderLoanList();
}

// リスト描画ヘルパー: 編集・削除ボタン生成
function createActionButtons(id, dataKey, formId, renderFuncName) {
    return `
        <div class="flex space-x-2">
            <button onclick="editItem('${id}', '${dataKey}', '${formId}')" class="text-gray-400 hover:text-blue-500 transition duration-200">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteItem('${id}', '${dataKey}', ${renderFuncName})" class="text-gray-400 hover:text-red-500 transition duration-200">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;
}

// 個別リスト描画関数群
function renderIncomeList() {
    const listEl = document.getElementById('income-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (!appData.incomes) appData.incomes = [];
    if (appData.incomes.length === 0) {
        listEl.innerHTML = '<li class="p-3 text-center text-gray-500 text-sm">収入源はまだありません</li>';
        return;
    }

    appData.incomes.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-3 flex justify-between items-center bg-white border border-gray-200 rounded mb-2';
        
        let info = `<div class="font-bold text-gray-700">${item.name}</div>`;
        info += `<div class="text-sm text-gray-600">`;
        info += `${item.start_age}歳〜${item.end_age}歳 / 年額${item.amount}万`;
        if (item.growth_rate) info += ` (変動${item.growth_rate}%)`;
        info += `</div>`;

        const isFirst = index === 0;
        const isLast = index === appData.incomes.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'incomes', -1, 'renderIncomeList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'incomes', 1, 'renderIncomeList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <div class="flex-1">${info}</div>
            ${createActionButtons(item.id, 'incomes', 'income-form', 'renderIncomeList')}`;
        listEl.appendChild(li);
    });
}

function renderExpenseList() {
    const listEl = document.getElementById('expense-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (!appData.expenses) appData.expenses = [];
    if (appData.expenses.length === 0) {
        listEl.innerHTML = '<li class="p-3 text-center text-gray-500 text-sm">生活費項目はまだありません</li>';
        return;
    }

    appData.expenses.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-3 flex justify-between items-center bg-white border border-gray-200 rounded mb-2';
        
        let info = `<div class="font-bold text-gray-700">${item.name}</div>`;
        info += `<div class="text-sm text-gray-600">`;
        info += `${item.start_age}歳〜${item.end_age}歳 / 年額${item.amount}万`;
        if (item.inflation_rate) info += ` (上昇率${item.inflation_rate}%)`;
        info += `</div>`;

        const isFirst = index === 0;
        const isLast = index === appData.expenses.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'expenses', -1, 'renderExpenseList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'expenses', 1, 'renderExpenseList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <div class="flex-1">${info}</div>
            ${createActionButtons(item.id, 'expenses', 'expense-form', 'renderExpenseList')}`;
        listEl.appendChild(li);
    });
}

function renderEventList() {
    const listEl = document.getElementById('event-list');
    listEl.innerHTML = '';
    if (appData.lifeEvents.length === 0) {
        listEl.innerHTML = '<li class="p-3 text-center text-gray-500 text-sm">イベントはまだありません</li>';
        return;
    }
    appData.lifeEvents.forEach((event, index) => {
        const item = document.createElement('li');
        item.className = 'p-3 flex justify-between items-center hover:bg-gray-50 transition duration-150';
        const costText = event.cost < 0 
            ? `<span class="text-green-600">+${Math.abs(event.cost)}万円</span>` 
            : `<span class="text-red-600">-${event.cost}万円</span>`;
        
        const isFirst = index === 0;
        const isLast = index === appData.lifeEvents.length - 1;

        item.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${event.id}', 'lifeEvents', -1, 'renderEventList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${event.id}', 'lifeEvents', 1, 'renderEventList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <div class="flex-1">
                <span class="font-bold text-gray-700 mr-2">${event.age}歳</span>
                <span class="text-gray-800">${event.event_name}</span>
            </div>
            <div class="flex items-center space-x-3">
                <span class="text-sm font-medium">${costText}</span>
                ${createActionButtons(event.id, 'lifeEvents', 'event-form', 'renderEventList')}
            </div>`;
        listEl.appendChild(item);
    });
}

function renderHousingList() {
    const list = document.getElementById('housing-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!appData.housings) appData.housings = [];
    
    appData.housings.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        let info = `[${item.type === 'rental' ? '賃貸' : '持ち家'}] ${item.name} (${item.start_age}歳~${item.end_age}歳)`;
        if (item.type === 'rental') {
            info += ` 家賃月${item.rent}万`;
        } else {
            if (item.maintenance_cost) info += ` 管理・修繕月${item.maintenance_cost}万`;
            info += ` 固定資産税年${item.tax}万`;
        }
        
        const isFirst = index === 0;
        const isLast = index === appData.housings.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'housings', -1, 'renderHousingList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'housings', 1, 'renderHousingList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <span class="flex-1">${info}</span>
            ${createActionButtons(item.id, 'housings', 'housing-form', 'renderHousingList')}`;
        list.appendChild(li);
    });
}

function renderFamilyList() {
    // 既存の処理
    const list = document.getElementById('family-list');
    list.innerHTML = '';
    appData.familyMembers.forEach((item, index) => {
        // ... (中略) ...
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        const relationMap = { self: '本人', spouse: '配偶者', child: '子', parent: '親', other: 'その他' };
        const genderMap = { male: '男性', female: '女性', other: 'その他' };
        
        let info = `${item.name} (${relationMap[item.relation] || item.relation})`;
        
        if (item.birth_date) {
            info += `, ${item.birth_date}生`;
        } else if (item.birth_year) {
            info += `, ${item.birth_year}年生`;
        }
        
        if (item.gender) info += `, ${genderMap[item.gender] || item.gender}`;
        
        if (item.disability && item.disability !== 'none') {
            const disabilityText = item.disability === 'present' ? 'あり' : item.disability;
            info += `, 障害:${disabilityText}`;
        }
        
        if (item.life_expectancy) info += `, 寿命:${item.life_expectancy}歳`;

        const isFirst = index === 0;
        const isLast = index === appData.familyMembers.length - 1;
        
        // 本人は操作不可にする（基本設定で管理）
        if (item.relation === 'self') {
            li.innerHTML = `
                <div class="flex items-center mr-2 space-x-1 invisible">
                    <span class="px-1"><i class="fa-solid fa-arrow-up"></i></span>
                    <span class="px-1"><i class="fa-solid fa-arrow-down"></i></span>
                </div>
                <span class="flex-1">${info} <span class="text-xs text-gray-400 ml-2">(基本設定で編集)</span></span>
                <div class="flex space-x-2 w-16"></div>`; // プレースホルダー
        } else {
            li.innerHTML = `
                <div class="flex items-center mr-2 space-x-1">
                    <button onclick="moveItem('${item.id}', 'familyMembers', -1, 'renderFamilyList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button onclick="moveItem('${item.id}', 'familyMembers', 1, 'renderFamilyList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                </div>
                <span class="flex-1">${info}</span>
                ${createActionButtons(item.id, 'familyMembers', 'family-form', 'renderFamilyList')}`;
        }
        list.appendChild(li);
    });

    // 年金フォームの受給者セレクトボックスを更新
    updatePensionFamilySelect();
    // 教育資金フォームの対象者セレクトボックスを更新
    updateEducationFamilySelect();
}

// 教育資金対象者セレクトボックス更新
function updateEducationFamilySelect() {
    const select = document.getElementById('education_owner_id');
    if (!select) return;
    
    const currentVal = select.value;
    select.innerHTML = '';
    
    appData.familyMembers.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.name} (${m.relation === 'self' ? '本人' : m.relation})`;
        select.appendChild(option);
    });
    
    if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
        select.value = currentVal;
    }
}

function renderEducationList() {
    const list = document.getElementById('education-list');
    list.innerHTML = '';
    if (!appData.educationFunds) appData.educationFunds = [];

    appData.educationFunds.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        const owner = appData.familyMembers.find(m => m.id === item.owner_id);
        const ownerName = owner ? owner.name : '不明';
        
        let info = `[${ownerName}] ${item.name} (${item.start_age}歳~${item.end_age}歳, 年額${item.amount}万)`;

        const isFirst = index === 0;
        const isLast = index === appData.educationFunds.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'educationFunds', -1, 'renderEducationList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'educationFunds', 1, 'renderEducationList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <span class="flex-1">${info}</span>
            ${createActionButtons(item.id, 'educationFunds', 'education-form', 'renderEducationList')}`;
        list.appendChild(li);
    });
}

// 年金受給者セレクトボックス更新
function updatePensionFamilySelect() {
    const select = document.getElementById('pension_owner_id');
    if (!select) return;
    
    // 現在の選択値を保持
    const currentVal = select.value;
    
    select.innerHTML = '';
    appData.familyMembers.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.name} (${m.relation === 'self' ? '本人' : m.relation})`;
        select.appendChild(option);
    });
    
    if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
        select.value = currentVal;
    }
}

function renderPensionList() {
    const list = document.getElementById('pension-list');
    list.innerHTML = '';
    
    // pensionsが未定義の場合のガード
    if (!appData.pensions) appData.pensions = [];

    appData.pensions.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        // 家族メンバーの名前を取得
        const owner = appData.familyMembers.find(m => m.id === item.owner_id);
        const ownerName = owner ? owner.name : '不明';
        
        let info = `[${ownerName}] ${item.name} (${item.start_age}歳から, 年額${item.amount}万)`;

        const isFirst = index === 0;
        const isLast = index === appData.pensions.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'pensions', -1, 'renderPensionList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'pensions', 1, 'renderPensionList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <span class="flex-1">${info}</span>
            ${createActionButtons(item.id, 'pensions', 'pension-form', 'renderPensionList')}`;
        list.appendChild(li);
    });
}

function renderInsuranceList() {
    const list = document.getElementById('insurance-list');
    list.innerHTML = '';
    appData.insurances.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        let info = '';
        if (item.company) info += `[${item.company}] `;
        info += item.name;
        
        if (item.period) {
            info += ` (期間${item.period}年, 年額${item.yearly_premium}万)`;
        } else {
            info += ` (年額${item.yearly_premium}万, ${item.payment_end_age}歳まで)`;
        }
        
        if (item.surrender_amount && item.surrender_age) {
            info += ` → 解約: ${item.surrender_age}歳で${item.surrender_amount}万`;
        }

        const isFirst = index === 0;
        const isLast = index === appData.insurances.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'insurances', -1, 'renderInsuranceList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'insurances', 1, 'renderInsuranceList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <span class="flex-1">${info}</span>
            ${createActionButtons(item.id, 'insurances', 'insurance-form', 'renderInsuranceList')}`;
        list.appendChild(li);
    });
}

function renderAssetList() {
    const list = document.getElementById('asset-list');
    list.innerHTML = '';
    appData.assets.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        const typeMap = {
            deposit: '預金', time_deposit: '定期預金', mutual_fund: '投資信託',
            nisa: 'NISA', crypto: '仮想通貨', bond: '国債', stock: '株式', other: 'その他'
        };
        const typeName = typeMap[item.asset_type] || item.asset_type || 'その他';

        let info = `[${typeName}] ${item.name} (${item.amount}万, ${item.return_rate}%)`;
        if (item.yearly_contribution > 0) {
            info += ` +年${item.yearly_contribution}万`;
            if (item.end_age) {
                info += `(~${item.end_age}歳)`;
            }
        }

        const isFirst = index === 0;
        const isLast = index === appData.assets.length - 1;

        if (item.withdrawal_age && item.withdrawal_amount > 0) {
            info += ` (取崩: ${item.withdrawal_age}歳~ 年${item.withdrawal_amount}万)`;
        }

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'assets', -1, 'renderAssetList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'assets', 1, 'renderAssetList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <span class="flex-1">${info}</span>
            ${createActionButtons(item.id, 'assets', 'asset-form', 'renderAssetList')}`;
        list.appendChild(li);
    });
}

function renderRealEstateList() {
    const list = document.getElementById('realestate-list');
    list.innerHTML = '';
    appData.realEstates.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-3 flex justify-between items-center bg-white border border-gray-200 rounded mb-2';
        
        let info = `<div class="font-bold">${item.name}</div>`;
        info += `<div class="text-sm text-gray-600">`;
        if (item.purchase_date) info += `購入: ${item.purchase_date} / `;
        info += `価格: ${item.purchase_price}万円`;
        if (item.loan_amount > 0) info += ` / 借入: ${item.loan_amount}万円(${item.loan_rate}%, ${item.loan_payments}回)`;
        if (item.sell_date) info += ` / <span class="text-red-600">売却予定: ${item.sell_date} (${item.sell_price}万円)</span>`;
        info += `</div>`;
        if (item.rent_income > 0 || item.maintenance_cost > 0 || item.tax > 0) {
            info += `<div class="text-xs text-gray-500">月収支: 家賃+${item.rent_income}万 / 維持-${item.maintenance_cost}万`;
            if (item.tax > 0) info += ` / 固定資産税-${item.tax}万(年)`;
            info += `</div>`;
        }

        const isFirst = index === 0;
        const isLast = index === appData.realEstates.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'realEstates', -1, 'renderRealEstateList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'realEstates', 1, 'renderRealEstateList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <div class="flex-1">${info}</div>
            ${createActionButtons(item.id, 'realEstates', 'realestate-form', 'renderRealEstateList')}`;
        list.appendChild(li);
    });
}

function renderLoanList() {
    const list = document.getElementById('loan-list');
    list.innerHTML = '';
    appData.loans.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'p-2 flex justify-between items-center';
        
        let info = `${item.name} (残${item.balance}万)`;
        if (item.monthly_payment && item.remaining_payments) {
            info += `, 月${item.monthly_payment}万 × 残${item.remaining_payments}回`;
        } else {
            info += `, 年${item.yearly_repayment}万 (~${item.end_age}歳)`;
        }

        const isFirst = index === 0;
        const isLast = index === appData.loans.length - 1;

        li.innerHTML = `
            <div class="flex items-center mr-2 space-x-1">
                <button onclick="moveItem('${item.id}', 'loans', -1, 'renderLoanList')" class="text-gray-400 hover:text-blue-500 px-1 ${isFirst ? 'invisible' : ''}" title="上へ移動">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="moveItem('${item.id}', 'loans', 1, 'renderLoanList')" class="text-gray-400 hover:text-blue-500 px-1 ${isLast ? 'invisible' : ''}" title="下へ移動">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <span class="flex-1">${info}</span>
            ${createActionButtons(item.id, 'loans', 'loan-form', 'renderLoanList')}`;
        list.appendChild(li);
    });
}

// CSVダウンロード
function downloadCSV() {
    if (!appData.userSettings) return;
    
    const data = calculateCashFlow();
    if (data.length === 0) return;

    // 行データ配列の配列
    let csvRows = [];

    // 1. ヘッダー行 (西暦)
    let headerRow = ['西暦'];
    data.forEach(d => headerRow.push(d.year + '年'));
    csvRows.push(headerRow);

    // 2. 年齢行 (本人) - 家族リストと重複するが、一番上にあると見やすい
    // 家族リスト側で本人も含めるので、ここはスキップでも良いが、
    // 画面の表と合わせるなら「年齢」行として1行目にあるのが自然。
    let ageRow = ['年齢(本人)'];
    data.forEach(d => ageRow.push(d.age + '歳'));
    csvRows.push(ageRow);

    // 3. 家族年齢
    const relationMap = { self: '本人', spouse: '配偶者', child: '子', parent: '親', other: 'その他' };
    appData.familyMembers.forEach(member => {
        if (member.relation === 'self') return; // 本人は上で出したのでスキップ（あるいは重複してもよい）
        
        const relationJP = relationMap[member.relation] || member.relation;
        let row = [`${member.name} (${relationJP})`];
        let birthYear = member.birth_year;
        if (member.birth_date) birthYear = new Date(member.birth_date).getFullYear();

        data.forEach(d => {
            let age = d.year - birthYear;
            if (age < 0) {
                row.push('-');
            } else if (member.life_expectancy && age > member.life_expectancy) {
                row.push('-');
            } else {
                row.push(age + '歳');
            }
        });
        csvRows.push(row);
    });

    // 空行
    csvRows.push([]);

    // 項目定義 (renderTableと同期させる)
    const rowDefs = [
        { type: 'section', label: '収入' },
        { key: 'income', label: '収入(含不動産)', detailsKey: 'incomeDetails' },
        
        { type: 'section', label: '支出' },
        { key: 'basicExpenses', label: '基本生活費', detailsKey: 'expenseDetails' },
        { key: 'educationCost', label: '教育費', detailsKey: 'educationDetails' },
        { key: 'housingCost', label: '住居費', detailsKey: 'housingDetails' },
        { key: 'insuranceCost', label: '保険料', detailsKey: 'insuranceDetails' },
        { key: 'loanRepayment', label: 'ローン返済', detailsKey: 'loanDetails' },
        { key: 'assetContribution', label: '金融資産積立', detailsKey: 'assetContributionDetails' },
        { key: 'assetWithdrawal', label: '金融資産取崩', detailsKey: 'assetWithdrawalDetails' },
        
        { type: 'section', label: 'イベント' },
        { key: 'eventNames', label: 'イベント内容' }, // テキスト
        { key: 'eventCost', label: 'イベント費用' },
        
        { type: 'section', label: '資産推移' },
        { key: 'balance', label: '年間収支' },
        { key: 'cashBalance', label: '現金残高' },
        { key: 'investmentBalance', label: '金融資産残高', detailsKey: 'investmentDetails' },
        { key: 'realEstateBalance', label: '不動産残高', detailsKey: 'realEstateDetails' },
        { key: 'savings', label: '総資産残高' }
    ];

    // 全データの詳細キーを収集するヘルパー
    const collectKeys = (data, keyName) => {
        const keys = new Set();
        data.forEach(d => {
            if (d[keyName]) {
                Object.keys(d[keyName]).forEach(k => keys.add(k));
            }
        });
        return Array.from(keys).sort();
    };

    rowDefs.forEach(def => {
        if (def.type === 'section') {
            csvRows.push([`[${def.label}]`]); // セクションヘッダー
            return;
        }

        // 親行
        let row = [def.label];
        data.forEach(d => {
            let val = d[def.key];
            if (val === undefined || val === null) val = '';
            // イベント名はそのまま、数値は四捨五入して文字列化(カンマなし)
            if (typeof val === 'number') {
                row.push(Math.round(val));
            } else {
                row.push(val);
            }
        });
        csvRows.push(row);

        // 詳細行
        if (def.detailsKey) {
            const detailKeys = collectKeys(data, def.detailsKey);
            detailKeys.forEach(detailKey => {
                let detailRow = [`  ${detailKey}`]; // インデントで見やすく
                data.forEach(d => {
                    let val = 0;
                    if (d[def.detailsKey] && d[def.detailsKey][detailKey] !== undefined) {
                        val = d[def.detailsKey][detailKey];
                    }
                    // 0の場合はハイフンまたは空文字にするか、0のままにするか
                    // CSVとしては0の方が扱いやすい場合も多いが、視認性重視で0は表示しない手もある。
                    // ここでは値をそのまま出す(0も出す)
                    detailRow.push(val !== 0 ? Math.round(val) : ''); 
                });
                csvRows.push(detailRow);
            });
        }
    });

    // CSV文字列作成 (エスケープ処理付き)
    const csvContent = csvRows.map(row => {
        return row.map(cell => {
            if (cell === null || cell === undefined) return '';
            let str = String(cell);
            // ダブルクォートがあればエスケープし、カンマや改行を含む場合も囲む
            if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    }).join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM付き
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'life_plan_simulation.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `life_plan_data_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.userSettings) throw new Error("Invalid format");
            appData = importedData;
            saveData();
            fillSettingsForm(appData.userSettings);
            renderAllLists();
            calculateAndRender();
            alert('データを読み込みました。');
        } catch (error) {
            console.error(error);
            alert('ファイルの読み込みに失敗しました。');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function clearData() {
    if (!confirm('全てのデータを削除して初期状態に戻しますか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
}

// 計算と描画
function calculateAndRender() {
    const simulationData = calculateCashFlow();
    renderTable(simulationData);
    renderLoanBalanceTable(simulationData);
    renderChart(simulationData);
}

function renderLoanBalanceTable(data) {
    const thead = document.getElementById('loan-balance-header-row');
    const tbody = document.getElementById('loan-balance-body');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length === 0) return;

    // ヘッダー行 (西暦)
    const thItem = document.createElement('th');
    thItem.className = 'px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-20 min-w-[150px] border-r border-gray-300';
    thItem.textContent = '西暦';
    thead.appendChild(thItem);

    data.forEach(d => {
        const th = document.createElement('th');
        th.className = 'px-3 py-2 text-right font-medium text-gray-600 min-w-[80px]';
        th.textContent = d.year;
        thead.appendChild(th);
    });

    // ローン一覧のキーを収集
    const loanKeys = new Set();
    data.forEach(d => {
        if (d.loanBalances) {
            Object.keys(d.loanBalances).forEach(k => loanKeys.add(k));
        }
    });
    
    if (loanKeys.size === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${data.length + 1}" class="px-3 py-4 text-center text-gray-500">ローンはありません</td>`;
        tbody.appendChild(tr);
        return;
    }

    const sortedLoanKeys = Array.from(loanKeys).sort();

    // 総ローン残高の計算と表示 (新規追加)
    let totalLoanBalanceRow = {
        name: '総ローン残高',
        values: data.map(d => {
            let sum = 0;
            if (d.loanBalances) {
                Object.values(d.loanBalances).forEach(val => sum += val);
            }
            return sum;
        })
    };

    // 先頭に追加
    const trTotal = document.createElement('tr');
    trTotal.className = 'bg-red-50 font-bold';
    const tdTotalLabel = document.createElement('td');
    tdTotalLabel.className = 'px-3 py-2 text-gray-800 font-bold sticky left-0 z-10 border-r border-gray-300 bg-red-50';
    tdTotalLabel.textContent = totalLoanBalanceRow.name;
    trTotal.appendChild(tdTotalLabel);

    totalLoanBalanceRow.values.forEach(val => {
        const td = document.createElement('td');
        td.className = 'px-3 py-2 text-right whitespace-nowrap text-red-600 font-bold';
        td.textContent = val > 0 ? Math.round(val).toLocaleString() : '-';
        trTotal.appendChild(td);
    });
    tbody.appendChild(trTotal);

    sortedLoanKeys.forEach(key => {
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        tdLabel.className = 'px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300';
        tdLabel.textContent = key;
        tr.appendChild(tdLabel);

        data.forEach(d => {
            const td = document.createElement('td');
            td.className = 'px-3 py-2 text-right whitespace-nowrap text-gray-600';
            const val = d.loanBalances ? (d.loanBalances[key] || 0) : 0;
            // 0になったらハイフン表示、あるいは0表示
            td.textContent = val > 0 ? Math.round(val).toLocaleString() : '-';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// アドバイス生成
function generateAdvice() {
    const loading = document.getElementById('advice-loading');
    const result = document.getElementById('advice-result');
    const adviceText = document.getElementById('advice-text');
    const btn = document.getElementById('generate-advice-btn');
    
    if (!loading || !result || !adviceText) return;

    // ローディング表示
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    // 簡易的な分析ロジック (AIシミュレーション)
    // 実際のAPIコールはできないため、計算結果に基づいたルールベースのアドバイスを生成
    setTimeout(() => {
        const data = calculateCashFlow();
        if (data.length === 0) {
            alert('アドバイスを生成するには、まず基本設定や収入・支出を入力してください。');
            loading.classList.add('hidden');
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            return;
        }

        const report = analyzeLifePlan(data);
        
        // 結果表示
        adviceText.innerHTML = report;
        loading.classList.add('hidden');
        result.classList.remove('hidden');
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }, 1500); // 1.5秒待機で分析感を演出
}

function analyzeLifePlan(data) {
    let bankruptAge = null;
    let minSavings = Infinity;
    let maxSavings = -Infinity;
    let retirementSavings = 0;
    const retirementAge = appData.userSettings.retirement_age;
    
    // データ走査
    data.forEach(d => {
        if (d.savings < 0 && bankruptAge === null) {
            bankruptAge = d.age;
        }
        if (d.savings < minSavings) minSavings = d.savings;
        if (d.savings > maxSavings) maxSavings = d.savings;
        if (d.age === retirementAge) retirementSavings = d.savings;
    });

    const finalSavings = data[data.length - 1].savings;
    let html = '';

    // 目標設定の取得
    const goals = appData.goals || {};

    // 1. 総評
    html += '<h3 class="text-lg font-bold text-gray-800 mb-2">📊 ライフプラン診断結果</h3>';
    if (bankruptAge) {
        html += `<p class="text-red-600 font-bold mb-4">⚠️ 注意が必要です：${bankruptAge}歳で資金が底をつく可能性があります。</p>`;
    } else {
        html += `<p class="text-green-600 font-bold mb-4">✅ 概ね良好です：95歳まで資金が維持できる見込みです。</p>`;
    }

    // 導入部
    html += '<p class="text-gray-600 mb-4">あなたの目標と現在の家計状況を照らし合わせ、率直かつ具体的にアドバイスさせていただきます。</p>';

    // 目標とのギャップ分析 (厳しい指摘)
    if (bankruptAge) {
        html += '<div class="bg-red-50 p-4 rounded border-l-4 border-red-500 mb-4 text-sm">';
        html += '<h4 class="font-bold text-red-700 mb-2">⚠️ 目標達成への警告</h4>';
        html += `<p class="text-red-800 mb-2">残念ながら、現在のプランのままでは<strong>${bankruptAge}歳で資金が底をつく</strong>試算が出ています。</p>`;
        
        if (goals.q1) {
            html += `<p class="text-red-800 mt-2">ご入力いただいた目標「<strong>${escapeHtml(goals.q1).substring(0, 50)}${goals.q1.length > 50 ? '...' : ''}</strong>」の実現は、現状では極めて困難です。夢を諦めるか、根本的な家計改善をするか、厳しい選択が必要です。</p>`;
        }
        if (goals.q4) {
            html += `<p class="text-red-800 mt-2">また、優先したいこととして「<strong>${escapeHtml(goals.q4).substring(0, 50)}${goals.q4.length > 50 ? '...' : ''}</strong>」とありますが、このままでは生活基盤そのものが危うくなる恐れがあります。</p>`;
        }
        html += '</div>';
    } else {
        // 余裕がある場合
        html += '<div class="bg-green-50 p-4 rounded border-l-4 border-green-500 mb-4 text-sm">';
        html += '<h4 class="font-bold text-green-700 mb-2">✨ 目標達成の見通し</h4>';
        html += `<p class="text-green-800 mb-2">現在のプランであれば、資金ショートすることなく95歳まで生活できる見込みです。</p>`;
        
        if (goals.q1) {
            html += `<p class="text-green-800 mt-2">目標とされている「<strong>${escapeHtml(goals.q1).substring(0, 50)}${goals.q1.length > 50 ? '...' : ''}</strong>」についても、十分に実現可能な範囲内と言えます。</p>`;
        }
        if (goals.q2) {
            html += `<p class="text-green-800 mt-2">楽しみに関する「<strong>${escapeHtml(goals.q2).substring(0, 50)}${goals.q2.length > 50 ? '...' : ''}</strong>」を叶えるための予算を、もう少し増やしても良いかもしれません。</p>`;
        }
        html += '</div>';
    }

    // 2. 詳細分析
    html += '<h4 class="font-bold text-gray-700 mt-4 mb-2">ポイント</h4>';
    html += '<ul class="list-disc list-inside space-y-1 text-gray-700 text-sm">';
    
    // 老後資金
    if (retirementSavings > 2000) {
        html += `<li>退職時（${retirementAge}歳）の資産は<strong>${Math.round(retirementSavings).toLocaleString()}万円</strong>です。老後資金としては安心できる水準です。</li>`;
    } else if (retirementSavings > 1000) {
        html += `<li>退職時（${retirementAge}歳）の資産は<strong>${Math.round(retirementSavings).toLocaleString()}万円</strong>です。平均的な水準ですが、無駄な支出には注意が必要です。</li>`;
    } else {
        html += `<li>退職時（${retirementAge}歳）の資産は<strong>${Math.round(retirementSavings).toLocaleString()}万円</strong>です。老後資金としてはやや心もとない可能性があります。長く働くことも検討しましょう。</li>`;
    }

    // 資産枯渇リスク
    if (bankruptAge) {
        html += `<li><strong>${bankruptAge}歳</strong>の時点で、収支バランスが崩れ、資産がマイナスに転じる予測です。この時期の前後に大きな支出（教育費、住宅購入など）がないか確認してください。</li>`;
    } else {
        html += `<li>生涯を通じて資産がマイナスになることはありません。最終的な資産残高は<strong>${Math.round(finalSavings).toLocaleString()}万円</strong>となる見込みです。</li>`;
        // 相続に関する目標がある場合
        if (goals.q3 && (goals.q3.includes('遺') || goals.q3.includes('残') || goals.q3.includes('子供'))) {
             html += `<li>「${escapeHtml(goals.q3).substring(0, 20)}...」というご希望に対して、十分な資産を残すことができそうです。</li>`;
        }
    }
    
    // 投資効果
    const totalInvestment = data[data.length - 1].investmentBalance;
    if (totalInvestment > 0) {
        html += `<li>資産運用による効果が出ています。最終的な金融資産残高は${Math.round(totalInvestment).toLocaleString()}万円となります。</li>`;
    } else {
        html += `<li>現在は資産運用が行われていない、または残高がありません。インフレリスクに備え、NISAなどを活用した長期投資を検討することをお勧めします。</li>`;
    }
    
    html += '</ul>';

    // 3. アドバイス
    html += '<h4 class="font-bold text-gray-700 mt-4 mb-2">AIからのアドバイス</h4>';
    html += '<div class="bg-white p-4 rounded border border-gray-200 text-gray-700 text-sm">';
    
    if (bankruptAge) {
        html += '<p class="mb-2">資金ショートを防ぐために、以下の対策を強く推奨します：</p>';
        html += '<ol class="list-decimal list-inside space-y-1">';
        html += '<li><strong>固定費の徹底的な見直し</strong>: 住居費や保険料など、毎月かかる費用を聖域なく削減してください。</li>';
        html += '<li><strong>収入の確保</strong>: 副業や共働き、あるいは退職後も長く働くことで、収入期間を延ばすことが最も効果的です。</li>';
        html += '<li><strong>目標の再設定</strong>: 厳しいことを申し上げますが、現在の目標設定（特に支出を伴うもの）は身の丈に合っていない可能性があります。優先順位の低いものから削除しましょう。</li>';
        html += '</ol>';
    } else {
        html += '<p>安定したライフプランです。より豊かな生活のために、以下の点も検討してみてください：</p>';
        html += '<ul class="list-disc list-inside space-y-1">';
        html += '<li><strong>資産運用の最適化</strong>: 余裕資金がある場合、もう少しリスクを取ってリターンを狙う運用（株式比率を高めるなど）も検討の余地があります。</li>';
        html += '<li><strong>使い道の計画</strong>: 資産が十分に残りそうです。趣味や旅行、寄付など、資産を有効に活用する計画も立ててみましょう。</li>';
        if (goals.q2) {
             html += `<li>ご記入いただいた楽しみ「${escapeHtml(goals.q2).substring(0, 20)}...」を、前倒しで実現することも可能かもしれません。</li>`;
        }
        html += '</ul>';
    }
    html += '</div>';

    return html;
}

// HTMLエスケープ関数
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

function calculateCashFlow() {
    if (!appData.userSettings || !appData.userSettings.birth_date) return [];

    const data = [];
    const currentYear = new Date().getFullYear();
    const endAge = 95;
    
    // 生年月日から現在の年齢（シミュレーション開始年齢）を計算
    const birthDate = new Date(appData.userSettings.birth_date);
    const birthYear = birthDate.getFullYear();
    // 簡易的に年単位で計算（詳細は月まで見る必要があるが、キャッシュフロー表は年単位なので）
    // 誕生日がまだ来ていなくても、その年の12/31時点の年齢（満年齢）基準で統一するのが一般的
    const currentAge = currentYear - birthYear;

    // 初期資産 (現金)
    let currentCash = appData.userSettings.current_savings;
    
    // 運用資産の初期化 (ディープコピー)
    let managedAssets = JSON.parse(JSON.stringify(appData.assets)).map(asset => ({
        ...asset,
        currentValue: asset.amount // 初期評価額
    }));
    
    // 不動産ローンの初期化 (シミュレーション用)
    let activeRealEstates = appData.realEstates.map(re => {
        // ローン月額計算 (元利均等返済)
        let monthlyPayment = 0;
        if (re.loan_amount > 0 && re.loan_payments > 0) {
            if (re.loan_rate > 0) {
                const r = re.loan_rate / 100 / 12;
                const n = re.loan_payments;
                monthlyPayment = (re.loan_amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            } else {
                monthlyPayment = re.loan_amount / re.loan_payments;
            }
        }
        return {
            ...re,
            remainingLoanBalance: re.loan_amount,
            remainingPayments: re.loan_payments,
            monthlyPayment: monthlyPayment,
            currentPrice: re.purchase_price // 価格推移は一旦固定
        };
    });

    let currentIncome = 0; // 使わないが互換性のため
    // const growthRate = 1 + (appData.userSettings.income_growth_rate / 100); // 各incomeで計算

    // ローン残高管理 (初期化) - 年齢ループの外で一度だけ初期化する
    let otherLoans = JSON.parse(JSON.stringify(appData.loans)).map(loan => ({
        ...loan,
        currentBalance: loan.balance, // 初期残高(元本)
        remainingPayments: loan.remaining_payments
    }));
    
    let ownedHousingLoans = [];
    if (appData.housings) {
        appData.housings.forEach(h => {
            if (h.type === 'owned' && h.loan_balance > 0) {
                // 現在の年齢 < 居住開始年齢 の場合、まだローンは始まっていない(残高0)とするか、
                // あるいは「借入予定」として表示するか。
                // ツールとしては「現在の残高」入力なので、現在すでにローンがあるならそのまま。
                // 未来のローンの場合、現在残高に入力してしまうと現在から減り始めるが、
                // ここでは「開始年齢」になったらローン残高がセットされるようにする。
                
                let initialBalance = h.loan_balance;
                let currentBalance = h.loan_balance;
                
                if (appData.userSettings.birth_date) {
                    const birthYear = new Date(appData.userSettings.birth_date).getFullYear();
                    const currentRealAge = new Date().getFullYear() - birthYear;
                    
                    // 未来の開始の場合、現在は0にしておく
                    if (h.start_age > currentRealAge) {
                        currentBalance = 0;
                    }
                }

                ownedHousingLoans.push({
                    ...h,
                    currentBalance: currentBalance,
                    initialBalance: initialBalance, // 開始時にセットする用
                    monthlyPayment: h.loan_monthly
                });
            }
        });
    }

    for (let age = currentAge; age <= endAge; age++) {
        // 年齢ループ
        const year = birthYear + age;
        
        let income = 0;
        
        let loanBalances = {}; // 年ごとのローン残高記録用

        let incomeBreakdown = {};

        // 支出内訳 (新規追加)
        let expenseBreakdown = {};
        let educationBreakdown = {};
        let housingBreakdown = {};
        let insuranceBreakdown = {};
        let loanBreakdown = {};
        let assetContributionBreakdown = {};
        let assetWithdrawalBreakdown = {};

        // 収入計算 (incomes配列を使用)
        if (appData.incomes) {
            appData.incomes.forEach(inc => {
                if (age >= inc.start_age && age <= inc.end_age) {
                    // 経過年数に応じた変動率適用
                    // start_age時点を基準(0年)とする
                    let amount = inc.amount;
                    if (inc.growth_rate) {
                        const yearsPassed = age - inc.start_age;
                        amount = amount * Math.pow(1 + inc.growth_rate / 100, yearsPassed);
                    }
                    amount = Math.round(amount);
                    income += amount;
                    
                    // 内訳
                    incomeBreakdown[inc.name] = (incomeBreakdown[inc.name] || 0) + amount;
                }
            });
        } else {
            // 後方互換性
            if (age < appData.userSettings.retirement_age) {
                income = Math.round(currentIncome);
                incomeBreakdown['給与収入(旧)'] = income;
            }
        }

        // 年金収入の計算
        let pensionIncome = 0;
        if (appData.pensions) {
            appData.pensions.forEach(pension => {
                // 対象メンバーを探す
                const member = appData.familyMembers.find(m => m.id === pension.owner_id);
                if (member) {
                    // メンバーの年齢を計算
                    let memberAge;
                    if (member.relation === 'self') {
                        memberAge = age;
                    } else {
                        // メンバーの誕生年
                        let memberBirthYear = member.birth_year;
                        if (member.birth_date) memberBirthYear = new Date(member.birth_date).getFullYear();
                        memberAge = year - memberBirthYear;
                    }
                    
                    // 受給判定
                    // 想定寿命内かどうかのチェックも必要
                    let isAlive = true;
                    if (member.life_expectancy && memberAge > member.life_expectancy) {
                        isAlive = false;
                    }

                    if (isAlive && memberAge >= pension.start_age) {
                        pensionIncome += pension.amount;
                        
                        const pName = `${pension.name}(${member.name})`;
                        incomeBreakdown[pName] = (incomeBreakdown[pName] || 0) + pension.amount;
                    }
                }
            });
        }
        // 収入に年金を加算
        income += pensionIncome;

        let expenses = 0;
        if (appData.expenses && appData.expenses.length > 0) {
            appData.expenses.forEach(exp => {
                if (age >= exp.start_age && age <= exp.end_age) {
                    let amount = Number(exp.amount) || 0;
                    if (exp.inflation_rate) {
                        const yearsPassed = age - exp.start_age;
                        amount = amount * Math.pow(1 + exp.inflation_rate / 100, yearsPassed);
                    }
                    amount = Math.round(amount);
                    expenses += amount;
                    expenseBreakdown[exp.name] = (expenseBreakdown[exp.name] || 0) + amount;
                }
            });
        } else {
            // データがない場合でも0にする（マイグレーションでデータが作られる前提）
            expenses = 0;
            // expenseBreakdown['基本生活費(旧)'] = expenses; // 0なので不要
        }

        // 教育資金
        let educationCost = 0;
        if (appData.educationFunds) {
            appData.educationFunds.forEach(edu => {
                const member = appData.familyMembers.find(m => m.id === edu.owner_id);
                if (member) {
                    let memberAge;
                    if (member.relation === 'self') {
                        memberAge = age;
                    } else {
                        let memberBirthYear = member.birth_year;
                        if (member.birth_date) memberBirthYear = new Date(member.birth_date).getFullYear();
                        memberAge = year - memberBirthYear;
                    }
                    
                    if (memberAge >= edu.start_age && memberAge <= edu.end_age) {
                        educationCost += edu.amount;
                        const eduName = `${edu.name}(${member.name})`;
                        educationBreakdown[eduName] = (educationBreakdown[eduName] || 0) + edu.amount;
                    }
                }
            });
        }

        // 保険料
        let insuranceCost = 0;
        appData.insurances.forEach(ins => {
            if (ins.period) {
                // startAgeは契約開始時点とみなすべきだが、
                // 簡易的にシミュレーション開始時点から、あるいは固定年齢からと仮定
                // 今回は「現在(currentAge)」を起点に期間分だけ払うロジックになっていたのでそれを踏襲
                const startAge = currentAge;
                if (age >= startAge && age < startAge + ins.period) {
                    insuranceCost += ins.yearly_premium;
                    insuranceBreakdown[ins.name] = (insuranceBreakdown[ins.name] || 0) + ins.yearly_premium;
                }
            } else if (ins.payment_end_age) {
                if (age <= ins.payment_end_age) {
                    insuranceCost += ins.yearly_premium;
                    insuranceBreakdown[ins.name] = (insuranceBreakdown[ins.name] || 0) + ins.yearly_premium;
                }
            }
        });

            // ローン返済 (一般)
            let loanRepayment = 0;
            
            // 1. その他のローン
            otherLoans.forEach(loan => {
                if (loan.currentBalance > 0) {
                    if (loan.monthly_payment && loan.remainingPayments > 0) {
                        const payCount = Math.min(12, loan.remainingPayments);
                        const yearlyPay = loan.monthly_payment * payCount;
                        loanRepayment += yearlyPay;
                        loanBreakdown[loan.name] = (loanBreakdown[loan.name] || 0) + yearlyPay;
                        
                        // 残高減算 (簡易的に元金均等のように減らすか、返済回数ベースで減らす)
                        // ここでは「返済回数」ベースで残高を減らすアプローチ
                        // 元本残高 = (残り回数 * 月額) とすると金利込みになってしまうが、
                        // ユーザー入力のbalanceが元本のみの場合、整合性が取れない。
                        // ここではシンプルに「返済した分だけ残高が減る」とする(金利0仮定)
                        // ただしマイナスにならないように制御
                        if (loan.currentBalance > yearlyPay) {
                            loan.currentBalance -= yearlyPay;
                        } else {
                            loan.currentBalance = 0;
                        }
                        
                        loan.remainingPayments -= payCount;
                    } else if (loan.yearly_repayment && loan.end_age && age <= loan.end_age) {
                        // 年払いパターンの場合(後方互換)
                        loanRepayment += loan.yearly_repayment;
                        loanBreakdown[loan.name] = (loanBreakdown[loan.name] || 0) + loan.yearly_repayment;
                        if (loan.currentBalance > loan.yearly_repayment) {
                            loan.currentBalance -= loan.yearly_repayment;
                        } else {
                            loan.currentBalance = 0;
                        }
                    }
                    
                    if (loan.currentBalance > 0) {
                        loanBalances[loan.name] = (loanBalances[loan.name] || 0) + loan.currentBalance;
                    }
                }
            });
            // 元のappData.loansループは削除し、上記otherLoansループで処理

            // 2. 住宅ローン (持ち家)
            ownedHousingLoans.forEach(h => {
                // 開始年に達したら残高セット(未来開始の場合)
                if (age === h.start_age && h.currentBalance === 0 && h.initialBalance > 0) {
                    h.currentBalance = h.initialBalance;
                }

                if (age >= h.start_age && (!h.loan_end_age || age <= h.loan_end_age)) {
                    if (h.currentBalance > 0) {
                        // 年間返済額
                        const yearlyPay = h.monthlyPayment * 12;
                        // 残高減算
                        if (h.currentBalance > yearlyPay) {
                            h.currentBalance -= yearlyPay;
                        } else {
                            h.currentBalance = 0;
                        }
                    }
                }
                
                // 表示記録 (残高があれば)
                if (h.currentBalance > 0) {
                    loanBalances[h.name] = (loanBalances[h.name] || 0) + h.currentBalance;
                }
            });

        // 住居費
        let housingCost = 0;
        // 敷金返還（収入扱い）
        let depositReturn = 0;
        // 敷金（資産扱い：返還までは現金からマイナスだが資産にプラス）
        let depositAsset = 0;

        if (appData.housings) {
            appData.housings.forEach(h => {
                if (age >= h.start_age && age <= h.end_age) {
                    let cost = 0;
                    if (h.type === 'rental') {
                        cost += (h.rent * 12);
                        if (age === h.start_age) {
                            // 初期費用（敷金含む）は一旦支出として計上するが、
                            // 後で調整するか、あるいはここでは現金支出として扱う
                            cost += h.initial;
                            housingBreakdown[`${h.name}(初期費用)`] = (housingBreakdown[`${h.name}(初期費用)`] || 0) + h.initial;
                        }
                        
                        // 敷金資産の計算（居住期間中は資産として計上）
                        if (h.initial > 0) {
                            depositAsset += h.initial;
                        }

                        const yearsSinceStart = age - h.start_age;
                        if (yearsSinceStart > 0 && yearsSinceStart % h.renewal_interval === 0) {
                            cost += h.renewal_cost;
                            housingBreakdown[`${h.name}(更新料)`] = (housingBreakdown[`${h.name}(更新料)`] || 0) + h.renewal_cost;
                        }
                        
                        // 家賃のみの分を記録(初期費用等は別で加算済みだが、ここでは合算後のcostから引くか、個別に足すか。
                        // ここでは家賃分を明示的に記録)
                        housingBreakdown[`${h.name}(家賃)`] = (housingBreakdown[`${h.name}(家賃)`] || 0) + (h.rent * 12);
                        
                        // 居住終了時に敷金が戻る（収入として加算）
                        // ※本来は退去時だが、簡易的に終了年に計上
                        // ※初期費用全額が敷金とは限らないが、ここではユーザー要望により「敷金」として扱う
                        if (age === h.end_age) {
                            depositReturn += h.initial;
                            if (h.initial > 0) {
                                incomeBreakdown['敷金返還'] = (incomeBreakdown['敷金返還'] || 0) + h.initial;
                            }
                        }

                    } else {
                        cost += h.tax;
                        housingBreakdown[`${h.name}(固定資産税)`] = (housingBreakdown[`${h.name}(固定資産税)`] || 0) + h.tax;

                        // 管理費・修繕積立金
                        if (h.maintenance_cost) {
                            cost += (h.maintenance_cost * 12);
                            housingBreakdown[`${h.name}(管理・修繕)`] = (housingBreakdown[`${h.name}(管理・修繕)`] || 0) + (h.maintenance_cost * 12);
                        }
                        if (h.loan_end_age && age <= h.loan_end_age) {
                            cost += (h.loan_monthly * 12);
                            housingBreakdown[`${h.name}(ローン)`] = (housingBreakdown[`${h.name}(ローン)`] || 0) + (h.loan_monthly * 12);
                        }
                    }
                    housingCost += cost;
                }
            });
        }

        // 不動産投資 (購入・返済・収益)
        let realEstateInitial = 0; // 購入時の初期支出 (頭金+諸費用)
        let realEstateIncome = 0;  // 家賃収入 - 維持費
        let realEstateLoanPay = 0; // ローン返済
        let realEstateAssetValue = 0; // 不動産資産額
        let realEstateTax = 0; // 固定資産税
        let realEstateSellProfit = 0; // 売却益
        let realEstateDetails = {}; // テーブル詳細用

        activeRealEstates.forEach(re => {
            // 売却判定
            let isSold = false;
            let isSellYear = false;
            let monthsOwned = 12;

            if (re.sell_date) {
                const sDate = new Date(re.sell_date);
                const sYear = sDate.getFullYear();
                if (year > sYear) {
                    return; // 売却済み
                }
                if (year === sYear) {
                    isSellYear = true;
                    // 簡易的に売却月まで保有とする
                    monthsOwned = sDate.getMonth() + 1;
                }
            }

            // 購入年判定
            let isPurchaseYear = false;
            let monthsInPurchaseYear = 12;
            
            if (re.purchase_date) {
                const pDate = new Date(re.purchase_date);
                const pYear = pDate.getFullYear();
                if (year === pYear) {
                    isPurchaseYear = true;
                    monthsInPurchaseYear = 12 - pDate.getMonth();
                    
                    // 購入時支出: 頭金(価格-借入) + 初期費用
                    const downPayment = Math.max(0, re.purchase_price - re.loan_amount);
                    realEstateInitial += (downPayment + re.initial_cost);
                } else if (year < pYear) {
                    return; // 購入前
                }
            } else {
                // 購入日未設定の場合は現在所有とみなす
            }

            // 実際の保有月数
            let actualMonths = 12;
            if (isPurchaseYear) actualMonths = monthsInPurchaseYear;
            if (isSellYear) actualMonths = Math.min(actualMonths, monthsOwned);

            // 収支 (家賃 - 維持費)
            const monthlyNet = (re.rent_income || 0) - (re.maintenance_cost || 0);
            const yearlyNet = monthlyNet * actualMonths;
            realEstateIncome += yearlyNet;
            
            if (yearlyNet !== 0) {
                incomeBreakdown['不動産収益'] = (incomeBreakdown['不動産収益'] || 0) + yearlyNet;
            }

            // 固定資産税 (年額) - 簡易的に保有期間に応じて月割り計算はせず、所有している年は全額計上とするか、
            // あるいは月割りするか。ここでは月割りで近似する。
            if (re.tax > 0) {
                const tax = Math.round(re.tax * (actualMonths / 12));
                realEstateTax += tax;
                // 不動産の固定資産税は現状loanRepaymentに合算しているため、loanBreakdownに追加
                loanBreakdown[`固定資産税(${re.name})`] = (loanBreakdown[`固定資産税(${re.name})`] || 0) + tax;
            }

            // ローン返済 (不動産)
            if (re.remainingPayments > 0) {
                const payCount = Math.min(actualMonths, re.remainingPayments);
                const yearlyPay = re.monthlyPayment * payCount;
                realEstateLoanPay += yearlyPay;
                re.remainingPayments -= payCount;
                
                loanBreakdown[`ローン返済(${re.name})`] = (loanBreakdown[`ローン返済(${re.name})`] || 0) + yearlyPay;
                
                // 残債の簡易減算
                if (re.remainingLoanBalance > 0) {
                    const monthlyRate = (re.loan_rate || 0) / 100 / 12;
                    for (let i = 0; i < payCount; i++) {
                        const interest = re.remainingLoanBalance * monthlyRate;
                        const principal = re.monthlyPayment - interest;
                        if (re.remainingLoanBalance > principal) {
                            re.remainingLoanBalance -= principal;
                        } else {
                            re.remainingLoanBalance = 0;
                        }
                    }
                }
                
                // 残高記録
                if (re.remainingLoanBalance > 0) {
                    loanBalances[re.name] = (loanBalances[re.name] || 0) + re.remainingLoanBalance;
                }
            }
            
            // 資産価値 (売却後は0)
            if (!isSellYear) {
                realEstateAssetValue += re.purchase_price; // 価値は一定と仮定
                realEstateDetails[re.name] = (realEstateDetails[re.name] || 0) + re.purchase_price;
            } else {
                // 売却処理
                // 売却益 = 売却額 - 諸経費 - ローン残債
                // 残債は上記ループで返済後のものを使用
                const profit = (re.sell_price || 0) - (re.sell_cost || 0) - re.remainingLoanBalance;
                realEstateSellProfit += profit;
                
                if (profit !== 0) {
                    incomeBreakdown['不動産売却益'] = (incomeBreakdown['不動産売却益'] || 0) + profit;
                }
                
                // ローン完済扱い
                re.remainingLoanBalance = 0;
                re.remainingPayments = 0;
            }
        });


        // ライフイベント
        const yearEvents = appData.lifeEvents.filter(e => e.age === age);
        let eventCost = 0;
        let eventNames = [];
        yearEvents.forEach(e => {
            eventCost += e.cost;
            eventNames.push(e.event_name);
        });

        // 保険解約返戻金
        appData.insurances.forEach(ins => {
            if (ins.surrender_age && ins.surrender_amount && ins.surrender_age === age) {
                eventCost -= ins.surrender_amount;
                eventNames.push(`${ins.name}(解約)`);
            }
        });

        // 資産運用シミュレーション
        let totalInvestmentContribution = 0;
        let totalInvestmentWithdrawal = 0; // 取崩し額合計
        let assetBreakdown = {}; // チャート用内訳
        let investmentDetails = {}; // テーブル詳細用
        
        // 資産タイプごとの集計初期化
        const assetTypes = ['deposit', 'time_deposit', 'mutual_fund', 'nisa', 'crypto', 'bond', 'stock', 'other'];
        assetTypes.forEach(t => assetBreakdown[t] = 0);
        assetBreakdown['other'] = 0; // マップ外用

        managedAssets.forEach(asset => {
            // 利回り計算 (複利)
            if (asset.return_rate) {
                asset.currentValue *= (1 + asset.return_rate / 100);
            }

            // 積立
            const contributionEndAge = asset.end_age || appData.userSettings.retirement_age;
            if (asset.yearly_contribution > 0 && age <= contributionEndAge) {
                const yearlyContribution = asset.yearly_contribution;
                asset.currentValue += yearlyContribution;
                totalInvestmentContribution += yearlyContribution;
                assetContributionBreakdown[asset.name] = (assetContributionBreakdown[asset.name] || 0) + yearlyContribution;
            }
            
            // 取崩し (新規実装)
            if (asset.withdrawal_age && age >= asset.withdrawal_age && asset.withdrawal_amount > 0) {
                // 残高がある場合のみ
                if (asset.currentValue > 0) {
                    let withdraw = asset.withdrawal_amount;
                    if (asset.currentValue < withdraw) {
                        withdraw = asset.currentValue; // 残高全額
                    }
                    asset.currentValue -= withdraw;
                    totalInvestmentWithdrawal += withdraw;
                    assetWithdrawalBreakdown[asset.name] = (assetWithdrawalBreakdown[asset.name] || 0) + withdraw;
                }
            }
            
            // タイプ別集計
            const type = asset.asset_type && assetTypes.includes(asset.asset_type) ? asset.asset_type : 'other';
            assetBreakdown[type] = (assetBreakdown[type] || 0) + asset.currentValue;
            
            // 詳細記録
            investmentDetails[asset.name] = (investmentDetails[asset.name] || 0) + asset.currentValue;
        });
        
        // 運用資産合計
        const totalManagedAssetsValue = Object.values(assetBreakdown).reduce((a, b) => a + b, 0);

        // 支出合計 (不動産関連含む: 税金もここで加算)
        const totalExpenses = expenses + insuranceCost + loanRepayment + housingCost + realEstateLoanPay + realEstateTax + educationCost;
        
        // 収支計算
        // 収入 + 不動産収支 + 不動産売却益 + 敷金返還 + 資産取り崩し - 支出 - イベント(含不動産購入) - 投資積立
        
        const annualBalance = (income + realEstateIncome + depositReturn + realEstateSellProfit + totalInvestmentWithdrawal) - totalExpenses - (eventCost + realEstateInitial) - totalInvestmentContribution;
        
        // 現金残高更新
        currentCash += annualBalance;
        
        // 総資産 (現金 + 運用資産 + 不動産 + 敷金資産)
        const totalSavings = currentCash + totalManagedAssetsValue + realEstateAssetValue + depositAsset;

        // イベント名に不動産購入を追加
        if (realEstateInitial > 0) eventNames.push('不動産購入');
        if (depositReturn > 0) eventNames.push('敷金返還');
        if (realEstateSellProfit !== 0) eventNames.push('不動産売却'); // 利益が0でも売却イベントはあるが、簡単のため

        data.push({
            age,
            year,
            income: income + realEstateIncome + depositReturn + realEstateSellProfit, // 収入欄に不動産収支・売却益・敷金返還も含める
            incomeDetails: incomeBreakdown,
            basicExpenses: expenses,
            expenseDetails: expenseBreakdown,
            educationCost, // 追加
            educationDetails: educationBreakdown,
            insuranceCost,
            insuranceDetails: insuranceBreakdown,
            housingCost,
            housingDetails: housingBreakdown,
            loanRepayment: loanRepayment + realEstateLoanPay + realEstateTax, // ローン欄に合算(税金もここに含めるか、その他にするか。一旦ローン枠に含めて合計支出を合わせる)
            loanDetails: loanBreakdown,
            // ※厳密には realEstateTax を housingCost か別の税金枠に入れたい所だが、
            // 表の列を増やしすぎないため、ここでは loanRepayment と合算して表示するか、totalExpenses との差額で調整される。
            // しかし renderTable では個別の key を表示しているので、合計が合わなくなる可能性がある。
            // loanRepayment に realEstateLoanPay + realEstateTax を入れることにする。
            
            totalExpenses,
            eventCost: eventCost + realEstateInitial,
            eventNames: eventNames.join(', '),
            assetContribution: totalInvestmentContribution, // 積立額
            assetContributionDetails: assetContributionBreakdown,
            assetWithdrawal: totalInvestmentWithdrawal, // 取崩し
            assetWithdrawalDetails: assetWithdrawalBreakdown,
            balance: annualBalance,
            cashBalance: currentCash,
            investmentBalance: totalManagedAssetsValue,
            investmentDetails: investmentDetails,
            realEstateBalance: realEstateAssetValue,
            realEstateDetails: realEstateDetails,
            depositBalance: depositAsset, // 敷金残高
            assetBreakdown: assetBreakdown, // 内訳データ
            loanBalances: loanBalances, // ローン残高データ
            savings: totalSavings
        });
    }

    return data;
}

// テーブル描画
function renderTable(data) {
    const thead = document.getElementById('cashflow-header-row');
    const tbody = document.getElementById('cashflow-body');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // ヘッダー行1: 項目名
    const thItem = document.createElement('th');
    thItem.className = 'px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-20 min-w-[150px] border-r border-gray-300';
    thItem.textContent = '西暦';
    thead.appendChild(thItem);

    // ヘッダー行1: 各年
    data.forEach(d => {
        const th = document.createElement('th');
        th.className = 'px-3 py-2 text-right font-medium text-gray-600 min-w-[80px]';
        th.textContent = d.year;
        thead.appendChild(th);
    });

    // 家族メンバーごとの年齢行
    // セクションヘッダー: 家族情報
    const trFamilyHeader = document.createElement('tr');
    trFamilyHeader.innerHTML = `<td colspan="${data.length + 1}" class="px-3 py-1 bg-gray-200 font-bold text-xs text-gray-700 sticky left-0 z-10">▼ 家族情報</td>`;
    tbody.appendChild(trFamilyHeader);

    appData.familyMembers.forEach(member => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.className = 'px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300';
        tdName.textContent = `${member.name} (${member.relation === 'self' ? '本人' : member.relation === 'spouse' ? '配偶者' : member.relation === 'child' ? '子' : 'その他'})`;
        tr.appendChild(tdName);

        data.forEach(d => {
            const tdAge = document.createElement('td');
            tdAge.className = 'px-3 py-2 text-right text-gray-500 text-sm';
            
            let birthYear = member.birth_year;
            if (member.birth_date) birthYear = new Date(member.birth_date).getFullYear();
            
            let age;
            if (member.relation === 'self') {
                age = d.age;
            } else {
                age = d.year - birthYear;
            }
            
            if (age < 0) {
                tdAge.textContent = '-';
            } else {
                if (member.life_expectancy && age > member.life_expectancy) {
                    tdAge.textContent = '-';
                    tdAge.className += ' bg-gray-100';
                } else {
                    tdAge.textContent = `${age}歳`;
                }
            }
            tr.appendChild(tdAge);
        });
        tbody.appendChild(tr);
    });

    const rows = [
        { type: 'section', label: '収入', class: 'bg-blue-100 text-blue-800' },
        { key: 'income', label: '収入(含不動産)', format: 'number', detailsKey: 'incomeDetails' },
        
        { type: 'section', label: '支出', class: 'bg-red-100 text-red-800' },
        { key: 'basicExpenses', label: '基本生活費', format: 'number', detailsKey: 'expenseDetails' },
        { key: 'educationCost', label: '教育費', format: 'number', detailsKey: 'educationDetails' },
        { key: 'housingCost', label: '住居費', format: 'number', detailsKey: 'housingDetails' },
        { key: 'insuranceCost', label: '保険料', format: 'number', detailsKey: 'insuranceDetails' },
        { key: 'loanRepayment', label: 'ローン返済', format: 'number', detailsKey: 'loanDetails' },
        { key: 'assetContribution', label: '金融資産積立', format: 'number', detailsKey: 'assetContributionDetails' },
        { key: 'assetWithdrawal', label: '金融資産取崩', format: 'number', detailsKey: 'assetWithdrawalDetails' },
        
        { type: 'section', label: 'イベント', class: 'bg-yellow-100 text-yellow-800' },
        { key: 'eventNames', label: 'イベント内容', format: 'text' },
        { key: 'eventCost', label: 'イベント費用', format: 'cost' },
        
        { type: 'section', label: '資産推移', class: 'bg-green-100 text-green-800' },
        { key: 'balance', label: '年間収支', format: 'color-number', bold: true },
        { key: 'cashBalance', label: '現金残高', format: 'color-number' },
        { key: 'investmentBalance', label: '金融資産残高', format: 'number', detailsKey: 'investmentDetails' },
        { key: 'realEstateBalance', label: '不動産残高', format: 'number', detailsKey: 'realEstateDetails' },
        { key: 'savings', label: '総資産残高', format: 'color-number', bold: true, bg: 'bg-green-50' }
    ];

    // 全データの詳細キーを収集するヘルパー
    const collectKeys = (data, keyName) => {
        const keys = new Set();
        data.forEach(d => {
            if (d[keyName]) {
                Object.keys(d[keyName]).forEach(k => keys.add(k));
            }
        });
        return Array.from(keys).sort();
    };

    // 各項目の詳細キーマップを作成
    const detailsMap = {};
    rows.forEach(r => {
        if (r.detailsKey) {
            detailsMap[r.key] = collectKeys(data, r.detailsKey);
        }
    });

    rows.forEach(rowDef => {
        if (rowDef.type === 'section') {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${data.length + 1}" class="px-3 py-1 font-bold text-xs sticky left-0 z-10 ${rowDef.class}">▼ ${rowDef.label}</td>`;
            tbody.appendChild(tr);
            return;
        }

        if (rowDef.detailsKey) {
            const detailKeys = detailsMap[rowDef.key];
            const hasDetails = detailKeys.length > 0;
            const toggleIconId = `${rowDef.key}-toggle-icon`;
            const detailRowClass = `${rowDef.key}-detail-row`;

            // 親行
            const tr = document.createElement('tr');
            if (hasDetails) {
                tr.className = 'cursor-pointer hover:bg-gray-50 transition-colors group';
                tr.onclick = () => {
                    const detailRows = document.querySelectorAll(`.${detailRowClass}`);
                    const icon = document.getElementById(toggleIconId);
                    let isHidden = false;
                    detailRows.forEach(r => {
                        if (r.classList.contains('hidden')) {
                            r.classList.remove('hidden');
                            isHidden = true;
                        } else {
                            r.classList.add('hidden');
                            isHidden = false;
                        }
                    });
                    if (icon) {
                        if (detailRows.length > 0 && !detailRows[0].classList.contains('hidden')) {
                            icon.classList.remove('fa-caret-right');
                            icon.classList.add('fa-caret-down');
                        } else {
                            icon.classList.remove('fa-caret-down');
                            icon.classList.add('fa-caret-right');
                        }
                    }
                };
            }

            const tdLabel = document.createElement('td');
            tdLabel.className = 'px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300';
            if (rowDef.bold) tdLabel.className += ' font-bold';
            
            if (hasDetails) {
                tdLabel.innerHTML = `<i id="${toggleIconId}" class="fa-solid fa-caret-right mr-2 text-gray-400"></i>${rowDef.label}`;
            } else {
                tdLabel.innerHTML = `<span class="pl-6">${rowDef.label}</span>`;
            }
            tr.appendChild(tdLabel);

            data.forEach(d => {
                const td = document.createElement('td');
                td.className = 'px-3 py-2 text-right whitespace-nowrap';
                const value = d[rowDef.key];
                td.textContent = Math.round(value).toLocaleString();
                tr.appendChild(td);
            });
            tbody.appendChild(tr);

            // 詳細行
            if (hasDetails) {
                detailKeys.forEach(key => {
                    const detailTr = document.createElement('tr');
                    detailTr.className = `${detailRowClass} hidden bg-blue-50`;
                    
                    const detailTdLabel = document.createElement('td');
                    detailTdLabel.className = 'px-3 py-1 text-gray-600 text-xs pl-8 sticky left-0 z-10 border-r border-gray-300 bg-blue-50';
                    detailTdLabel.textContent = key;
                    detailTr.appendChild(detailTdLabel);
                    
                    data.forEach(d => {
                        const td = document.createElement('td');
                        td.className = 'px-3 py-1 text-right whitespace-nowrap text-xs text-gray-600';
                        const val = d[rowDef.detailsKey] ? (d[rowDef.detailsKey][key] || 0) : 0;
                        td.textContent = val !== 0 ? Math.round(val).toLocaleString() : '-';
                        detailTr.appendChild(td);
                    });
                    tbody.appendChild(detailTr);
                });
            }
            return;
        }

        const tr = document.createElement('tr');
        if (rowDef.bg) tr.className = rowDef.bg;
        
        const tdLabel = document.createElement('td');
        tdLabel.className = 'px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300';
        if (rowDef.bold) tdLabel.className += ' font-bold';
        tdLabel.textContent = rowDef.label;
        tr.appendChild(tdLabel);

        data.forEach(d => {
            const td = document.createElement('td');
            td.className = 'px-3 py-2 text-right whitespace-nowrap';
            if (rowDef.bold) td.className += ' font-bold';
            
            const value = d[rowDef.key];
            
            if (rowDef.format === 'number') {
                td.textContent = Math.round(value).toLocaleString();
            } else if (rowDef.format === 'text') {
                td.className = 'px-3 py-2 text-right text-xs';
                td.textContent = value || '-';
            } else if (rowDef.format === 'cost') {
                if (value === 0) td.textContent = '-';
                else if (value < 0) td.innerHTML = `<span class="text-green-600">+${Math.abs(value).toLocaleString()}</span>`;
                else td.innerHTML = `<span class="text-red-600">-${value.toLocaleString()}</span>`;
            } else if (rowDef.format === 'color-number') {
                if (value < 0) td.className += ' text-red-600 font-bold';
                else if (rowDef.key === 'balance') td.className += ' text-blue-600';
                td.textContent = Math.round(value).toLocaleString();
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// チャート描画 (積み上げ面グラフ) - 資産内訳対応
function renderChart(data) {
    const ctx = document.getElementById('assetChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const labels = data.map(d => `${d.age}歳`);
    
    // データセット構築
    const datasets = [];
    
    // 3. 不動産
    datasets.push({
        label: '不動産',
        data: data.map(d => d.realEstateBalance),
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0
    });

    // 4. 敷金
    if (data.some(d => d.depositBalance > 0)) {
        datasets.push({
            label: '敷金',
            data: data.map(d => d.depositBalance),
            borderColor: 'rgb(16, 185, 129)', // emerald-500
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderWidth: 1,
            fill: true,
            pointRadius: 0
        });
    }

    // 2. 金融資産 (タイプ別)
    // データの最初のレコードなどからキーを取得(全ての行でキーは同じはず)
    if (data.length > 0 && data[0].assetBreakdown) {
        const assetTypes = Object.keys(data[0].assetBreakdown);
        const typeLabels = {
            deposit: '預金', time_deposit: '定期', mutual_fund: '投資信託',
            nisa: 'NISA', crypto: '暗号資産', bond: '債券', stock: '株式', other: 'その他'
        };
        const colors = {
            deposit: 'rgb(147, 197, 253)', // blue-300
            time_deposit: 'rgb(96, 165, 250)', // blue-400
            mutual_fund: 'rgb(234, 179, 8)', // yellow-500
            nisa: 'rgb(250, 204, 21)', // yellow-400
            crypto: 'rgb(168, 85, 247)', // purple-500
            bond: 'rgb(34, 197, 94)', // green-500
            stock: 'rgb(249, 115, 22)', // orange-500
            other: 'rgb(156, 163, 175)' // gray-400
        };

        assetTypes.forEach(type => {
            // そのタイプの資産がシミュレーション期間中に一度でも0より大きければ表示
            const values = data.map(d => d.assetBreakdown[type] || 0);
            if (values.some(v => v > 0)) {
                datasets.push({
                    label: typeLabels[type] || type,
                    data: values,
                    borderColor: colors[type] || colors.other,
                    backgroundColor: (colors[type] || colors.other).replace('rgb', 'rgba').replace(')', ', 0.5)'),
                    borderWidth: 1,
                    fill: true,
                    pointRadius: 0
                });
            }
        });
    }

    // 1. 現金
    datasets.push({
        label: '現金資産',
        data: data.map(d => d.cashBalance),
        borderColor: 'rgb(37, 99, 235)', // blue-600
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0
    });

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${Math.round(context.parsed.y).toLocaleString()} 万円`;
                        },
                        footer: function(tooltipItems) {
                            let total = 0;
                            tooltipItems.forEach(function(tooltipItem) {
                                total += tooltipItem.parsed.y;
                            });
                            return '総資産: ' + Math.round(total).toLocaleString() + ' 万円';
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: false,
                    grid: {
                        color: (context) => context.tick.value === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                    }
                }
            }
        }
    });
}
