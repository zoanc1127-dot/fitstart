/* ==========================================
   FitStart - 核心逻辑交互脚本
   ========================================== */

let allExercises = [];
let currentFilters = {
  search: '',
  bodyPart: 'all',
  equipment: 'all',
  noEquipment: false
};

// 身体部位映射字典 (中文 -> 数据集英文)
const bodyPartMap = {
  '胸部': 'chest',
  '背部': 'back',
  '肩部': 'shoulders',
  '手臂': 'upper arms',
  '腹部': 'waist',
  '腿部': 'upper legs',
  '有氧': 'cardio'
};

// 器械映射字典 (中文 -> 数据集英文)
const equipmentMap = {
  '徒手': 'body weight',
  '哑铃': 'dumbbell',
  '杠铃': 'barbell',
  '拉力器': 'cable',
  '弹力带': 'band',
  '健身器械': 'machine'
};

document.addEventListener('DOMContentLoaded', () => {
  loadExercises();
  initEventListeners();
});

// 异步加载本地 JSON 数据
async function loadExercises() {
  try {
    const response = await fetch('data/exercises.json');
    if (!response.ok) throw new Error('网络响应异常');
    allExercises = await response.json();
    updateStats(allExercises.length, allExercises.length);
    renderExercises(allExercises);
  } catch (error) {
    console.error('加载动作数据失败:', error);
    showErrorState();
  }
}

// 初始化事件监听
function initEventListeners() {
  // 搜索框输入
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  // 部位筛选标签点击
  document.querySelectorAll('#bodyPartTags .tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      document.querySelectorAll('#bodyPartTags .tag').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const selectedZh = e.target.getAttribute('data-part');
      currentFilters.bodyPart = selectedZh === 'all' ? 'all' : (bodyPartMap[selectedZh] || selectedZh);
      applyFilters();
    });
  });

  // 器械筛选标签点击
  document.querySelectorAll('#equipmentTags .tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      document.querySelectorAll('#equipmentTags .tag').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const selectedEq = e.target.getAttribute('data-eq');
      if (selectedEq === 'no-equipment') {
        currentFilters.noEquipment = true;
        currentFilters.equipment = 'all';
      } else {
        currentFilters.noEquipment = false;
        currentFilters.equipment = selectedEq === 'all' ? 'all' : (equipmentMap[selectedEq] || selectedEq);
      }
      applyFilters();
    });
  });

  // 模态框关闭
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('exerciseModal').addEventListener('click', (e) => {
    if (e.target.id === 'exerciseModal') closeModal();
  });
}

// 复合筛选核心算法
function applyFilters() {
  const filtered = allExercises.filter(item => {
    // 1. 搜索词匹配 (同时匹配中英文名称及部位)
    const matchSearch = currentFilters.search === '' || 
      item.name.toLowerCase().includes(currentFilters.search) ||
      (item.name_zh && item.name_zh.toLowerCase().includes(currentFilters.search)) ||
      (item.body_part && item.body_part.toLowerCase().includes(currentFilters.search));

    // 2. 身体部位匹配
    const matchBodyPart = currentFilters.bodyPart === 'all' || item.body_part === currentFilters.bodyPart;

    // 3. 器械或无器械匹配
    let matchEquipment = true;
    if (currentFilters.noEquipment) {
      matchEquipment = item.equipment === 'body weight';
    } else if (currentFilters.equipment !== 'all') {
      matchEquipment = item.equipment === currentFilters.equipment;
    }

    return matchSearch && matchBodyPart && matchEquipment;
  });

  updateStats(filtered.length, allExercises.length);
  renderExercises(filtered);
}

// 渲染卡片列表
function renderExercises(list) {
  const grid = document.getElementById('exerciseGrid');
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>没有找到符合条件的动作</h3>
        <p>请尝试更换搜索关键词或减少筛选条件。如果某些动作数据暂无，我们后续将持续补充。</p>
      </div>
    `;
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.onclick = () => showExerciseDetail(item);

    card.innerHTML = `
      <div class="card-img-placeholder">FitStart 动作</div>
      <div class="card-content">
        <div>
          <div class="card-title">${item.name_zh || item.name}</div>
          <div class="card-subtitle">${item.name}</div>
        </div>
        <div class="card-tags">
          <span class="mini-badge">部位: ${item.body_part || '综合'}</span>
          <span class="mini-badge">器械: ${item.equipment || '徒手'}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 展示动作详情弹窗
function showExerciseDetail(item) {
  document.getElementById('modalTitle').innerText = item.name_zh || item.name;
  document.getElementById('modalSubtitle').innerText = `英文原名: ${item.name}`;

  // 目标肌肉与次要肌肉
  document.getElementById('modalTarget').innerText = item.target ? `主要训练: ${item.target}` : '暂无资料';
  document.getElementById('modalSecondary').innerText = item.secondary_muscles && item.secondary_muscles.length > 0 ? `辅助肌肉: ${item.secondary_muscles.join(', ')}` : '暂无资料';
  document.getElementById('modalEquipment').innerText = item.equipment ? `所需器械: ${item.equipment}` : '暂无资料';

  // 中文步骤
  const stepsList = document.getElementById('modalSteps');
  stepsList.innerHTML = '';
  const steps = item.instruction_steps || item.instructions;
  if (steps && steps.length > 0) {
    steps.forEach(step => {
      const li = document.createElement('li');
      li.innerText = typeof step === 'string' ? step : JSON.stringify(step);
      stepsList.appendChild(li);
    });
  } else {
    stepsList.innerHTML = '<li>暂无详细动作步骤资料</li>';
  }

  // 常见错误
  const mistakesList = document.getElementById('modalMistakes');
  mistakesList.innerHTML = '';
  if (item.common_mistakes && item.common_mistakes.length > 0) {
    item.common_mistakes.forEach(m => {
      const li = document.createElement('li');
      li.innerText = m;
      mistakesList.appendChild(li);
    });
  } else {
    mistakesList.innerHTML = '<li>暂无资料</li>';
  }

  // 安全注意事项
  const safetyList = document.getElementById('modalSafety');
  safetyList.innerHTML = '';
  if (item.safety_tips && item.safety_tips.length > 0) {
    item.safety_tips.forEach(s => {
      const li = document.createElement('li');
      li.innerText = s;
      safetyList.appendChild(li);
    });
  } else {
    safetyList.innerHTML = '<li>请量力而行，初学者建议在专业教练指导下进行训练。</li>';
  }

  document.getElementById('exerciseModal').classList.add('active');
}

// 关闭弹窗
function closeModal() {
  document.getElementById('exerciseModal').classList.remove('active');
}

// 更新统计数据
function updateStats(filteredCount, totalCount) {
  document.getElementById('resultCount').innerText = filteredCount;
  document.getElementById('totalCount').innerText = totalCount;
}

// 错误状态显示
function showErrorState() {
  const grid = document.getElementById('exerciseGrid');
  grid.innerHTML = `
    <div class="empty-state">
      <h3>无法加载本地动作数据库</h3>
      <p>检测到可能未通过本地服务器运行（CORS 安全限制）。请参考 README 指南使用 VS Code Live Server 或 Python 简易服务器打开！</p>
    </div>
  `;
}