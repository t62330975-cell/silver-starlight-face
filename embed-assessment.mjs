// Replacement callbacks preserve literal $&, $', and $\x60 in bundled scripts.
export function embedAssessment(html,css,js){
 const inlineJs=js.replace(/<\/script/gi,'<\\/script');
 return html.replace('<head>','<head><base target="_top">')
  .replace('<link rel="stylesheet" href="assessment.css">',()=>'<style>'+css+'</style>')
  .replace('<script src="assessment.js"></script>',()=>'<script>'+inlineJs+'</script>');
}
