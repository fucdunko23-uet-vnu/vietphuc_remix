const { DatabaseSync } = require('node:sqlite');
const { parse } = require('D:/n8n/node_modules/flatted');
const d = new DatabaseSync('D:/n8n/data/.n8n/database.sqlite', { readOnly: true });
const wf = d.prepare('SELECT * FROM workflow_entity WHERE id=?').get('vietPhucRemixStudio');
console.log({ versionId: wf.versionId, activeVersionId: wf.activeVersionId, ai: JSON.parse(wf.nodes).find(n => n.name === 'Chuẩn bị dữ liệu').parameters.jsCode.slice(0, 110) });
console.log(d.prepare('SELECT versionId,name,createdAt FROM workflow_history WHERE workflowId=? ORDER BY createdAt DESC LIMIT 4').all(wf.id));
const history = d.prepare('SELECT nodes FROM workflow_history WHERE versionId=?').get(wf.activeVersionId);
console.log('Published AI:', JSON.parse(history.nodes).find(n => n.name === 'Chuẩn bị dữ liệu').parameters.jsCode.slice(0, 110));
console.log(d.prepare('SELECT id,status,startedAt FROM execution_entity WHERE workflowId=? ORDER BY id DESC LIMIT 4').all(wf.id));
const row = d.prepare('SELECT e.id,e.status,x.data FROM execution_entity e JOIN execution_data x ON x.executionId=e.id WHERE e.workflowId=? ORDER BY e.id DESC LIMIT 1').get('vietPhucRemixStudio');
const v = parse(row.data);
console.log('Execution:', row.id, row.status);
const executionWorkflow = JSON.parse(d.prepare('SELECT workflowData FROM execution_data WHERE executionId=?').get(row.id).workflowData);
console.log('Executed AI code:', executionWorkflow.nodes.find(n => n.name === 'Chuẩn bị dữ liệu').parameters.jsCode.slice(0, 110));
console.log('Prepared useAI:', v.resultData.runData['Chuẩn bị dữ liệu']?.[0]?.data?.main?.[0]?.[0]?.json?.useAI);
for (const [name, values] of Object.entries(v.resultData.runData)) {
  const r = values[0];
  console.log(name, r.executionStatus);
  if (name === 'AI tạo gợi ý') {
    const data = r.data?.main?.[0]?.[0]?.json || {};
    const error = data.error || r.error;
    console.log(JSON.stringify(error ? { error } : { candidates: data.candidates?.length, finish: data.candidates?.[0]?.finishReason }).replace(/AIza[\w-]+/g, '[redacted]').replace(/key=[^&\s"\\]+/g, 'key=[redacted]').slice(0, 1800));
  }
}
d.close();
