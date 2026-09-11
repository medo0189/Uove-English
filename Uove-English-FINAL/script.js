const $=s=>document.querySelector(s);
let words=[];
let stats={answers:0,correct:0};
try{words=JSON.parse(localStorage.getItem("uoveWords")||"[]");if(!Array.isArray(words))words=[]}catch(e){words=[]}
try{stats=JSON.parse(localStorage.getItem("uoveStats")||'{"answers":0,"correct":0}');}catch(e){stats={answers:0,correct:0}}

function save(){
 localStorage.setItem("uoveWords",JSON.stringify(words));
 localStorage.setItem("uoveStats",JSON.stringify(stats));
 update();
}
function update(){
 const acc=stats.answers?Math.round(stats.correct/stats.answers*100):0;
 $("#homeCount").textContent=words.length;
 $("#homeAnswers").textContent=stats.answers;
 $("#homeAccuracy").textContent=acc+"%";
 $("#progressWords").textContent=words.length;
 $("#progressAnswers").textContent=stats.answers;
 $("#progressAccuracy").textContent=acc+"%";
}
function showPage(id){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 $("#"+id).classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
 if(id==="words")renderWords();
 if(id==="practice")showPractice();
}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));

function openModal(){$("#modal").classList.add("show");$("#newEn").focus()}
function closeModal(){$("#modal").classList.remove("show")}
$("#addBtn").addEventListener("click",openModal);
$("#goAdd").addEventListener("click",()=>{showPage("words");openModal()});
$("#closeModal").addEventListener("click",closeModal);

$("#saveWord").addEventListener("click",()=>{
 const en=$("#newEn").value.trim(),ar=$("#newAr").value.trim(),ex=$("#newEx").value.trim();
 if(!en||!ar){alert("اكتب الكلمة والمعنى أولاً");return}
 if(words.some(w=>w.en.toLowerCase()===en.toLowerCase())){alert("الكلمة موجودة بالفعل");return}
 words.unshift({en,ar,ex:ex||"—"});
 $("#newEn").value=$("#newAr").value=$("#newEx").value="";
 closeModal();save();renderWords();
});
$("#modal").addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal()});

function renderWords(){
 const q=$("#search").value.trim().toLowerCase();
 const list=words.filter(w=>(w.en+" "+w.ar).toLowerCase().includes(q));
 if(!list.length){
   $("#wordList").innerHTML=words.length
    ? '<div class="empty">لا توجد نتائج بحث.</div>'
    : '<div class="empty"><h2>لسه مفيش كلمات 👀</h2><p>اضغط «إضافة كلمة» واكتب كلماتك بنفسك.</p><button class="primary" onclick="openModal()">+ إضافة كلمة</button></div>';
   return;
 }
 $("#wordList").innerHTML=list.map((w,i)=>`<div class="word">
 <b>${esc(w.en)}</b><span>${esc(w.ar)}</span><span class="ex">${esc(w.ex)}</span>
 <button class="delete" data-index="${words.indexOf(w)}">🗑️ حذف</button></div>`).join("");
}
$("#search").addEventListener("input",renderWords);

$("#wordList").addEventListener("click",e=>{
 const btn=e.target.closest(".delete"); if(!btn)return;
 const i=Number(btn.dataset.index);
 if(!Number.isInteger(i)||!words[i])return;
 if(confirm(`هل تريد حذف "${words[i].en}"؟`)){words.splice(i,1);save();renderWords();}
});

function showPractice(){
 if(!words.length){
   $("#quizPanel").innerHTML='<h2>مفيش كلمات للتدريب 😅</h2><p>أضف كلماتك أولاً، وبعدها ابدأ الاختبار.</p><button class="primary" onclick="showPage(\'words\');openModal()">+ إضافة كلمة</button>';
   return;
 }
 $("#quizPanel").innerHTML='<h2>جاهز للتدريب؟ 🧠</h2><p>اختار طريقة الاختبار:</p><div class="quizButtons"><button class="primary" onclick="startQuiz(\'en-ar\')">إنجليزي → عربي</button><button class="primary" onclick="startQuiz(\'ar-en\')">عربي → إنجليزي</button><button class="primary" onclick="startQuiz(\'mixed\')">مختلط</button></div>';
}
let quiz=null;
function startQuiz(mode){
 if(!words.length)return;
 quiz={mode,index:0,correct:0,items:[...words].sort(()=>Math.random()-.5).slice(0,Math.min(10,words.length))};
 renderQuestion();
}
function renderQuestion(){
 if(quiz.index>=quiz.items.length){finishQuiz();return}
 const w=quiz.items[quiz.index];
 const dir=quiz.mode==="mixed"?(Math.random()<.5?"en-ar":"ar-en"):quiz.mode;
 quiz.dir=dir;
 const prompt=dir==="en-ar"?w.en:w.ar;
 const correct=dir==="en-ar"?w.ar:w.en;
 const others=words.filter(x=>x!==w).sort(()=>Math.random()-.5).slice(0,3).map(x=>dir==="en-ar"?x.ar:x.en);
 const opts=[...new Set([...others,correct])].sort(()=>Math.random()-.5);
 while(opts.length<Math.min(4,words.length))opts.push("—");
 $("#quizPanel").innerHTML=`<p>السؤال ${quiz.index+1} من ${quiz.items.length}</p><div class="question">${esc(prompt)}</div><div class="answers">${opts.slice(0,4).map(a=>`<button class="answer" data-answer="${escAttr(a)}">${esc(a)}</button>`).join("")}</div>`;
}
$("#quizPanel").addEventListener("click",e=>{
 const btn=e.target.closest(".answer");if(!btn||btn.disabled)return;
 document.querySelectorAll(".answer").forEach(x=>x.disabled=true);
 const correct=quiz.dir==="en-ar"?quiz.items[quiz.index].ar:quiz.items[quiz.index].en;
 const ok=btn.dataset.answer===correct;
 btn.classList.add(ok?"correct":"wrong");
 stats.answers++;if(ok){stats.correct++;}
 setTimeout(()=>{quiz.index++;quiz.correct+=ok?1:0;save();renderQuestion()},500);
});
function finishQuiz(){
 const a=Math.round(quiz.correct/quiz.items.length*100);
 $("#quizPanel").innerHTML=`<h2>خلصت الاختبار 🎉</h2><div class="question">${quiz.correct}/${quiz.items.length}</div><p>الدقة: ${a}%</p><button class="primary" onclick="startQuiz('mixed')">إعادة الاختبار</button>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escAttr(s){return esc(s).replace(/`/g,"&#096;")}
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("uoveDark",document.body.classList.contains("dark"))});
if(localStorage.getItem("uoveDark")==="true")document.body.classList.add("dark");
update();renderWords();showPractice();