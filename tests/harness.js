(function(){
  const resultsEl = document.getElementById('results');
  const tests = [];
  let passed = 0, failed = 0;

  function renderResult(name, ok, err){
    const div = document.createElement('div');
    div.className = 'test ' + (ok ? 'pass' : 'fail');
    div.textContent = (ok ? 'PASS: ' : 'FAIL: ') + name + (err ? ' — ' + err : '');
    resultsEl.appendChild(div);
  }
  function summary(){
    const div = document.createElement('div');
    div.className = 'summary';
    div.textContent = `Summary: ${passed} passed, ${failed} failed, ${passed+failed} total`;
    resultsEl.appendChild(div);
  }

  window.test = function(name, fn){
    tests.push({ name, fn });
  };

  window.expect = function(actual){
    return {
      toBe(expected){
        if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      },
      toEqual(expected){
        const a = JSON.stringify(actual);
        const b = JSON.stringify(expected);
        if (a !== b) throw new Error(`Expected ${a} to equal ${b}`);
      },
      toBeTruthy(){
        if (!actual) throw new Error(`Expected value to be truthy, got ${actual}`);
      },
      toContain(item){
        if (!Array.isArray(actual)) throw new Error('toContain expects an array');
        if (!actual.includes(item)) throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      }
    };
  };

  window.assert = function(condition, message){
    if (!condition) throw new Error(message || 'Assertion failed');
  };

  window.runTests = async function(){
    for (const t of tests){
      try {
        await t.fn();
        passed++;
        renderResult(t.name, true);
      } catch (err){
        failed++;
        renderResult(t.name, false, err && err.message ? err.message : String(err));
      }
    }
    summary();
  };

  // Run after full page load to ensure script.js has initialized listeners
  window.addEventListener('load', () => setTimeout(runTests, 0));
})();