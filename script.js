document.addEventListener('DOMContentLoaded', () => {
  const groups = document.querySelectorAll('.btn-group');
  groups.forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if(!btn) return;
      group.querySelectorAll('button').forEach(b => b.classList.remove('filled'));
      btn.classList.add('filled');
      group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed','false'));
      btn.setAttribute('aria-pressed','true');
    });
  });

  document.getElementById('btn-nasa').addEventListener('click', () => {
    console.log('Exemplo da NASA (placeholder)');
  });

  document.getElementById('btn-simular').addEventListener('click', () => {
    console.log('Simular (placeholder)');
  });
});
