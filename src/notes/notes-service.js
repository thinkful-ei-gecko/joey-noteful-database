const notesService = {
  getAllNotes(knex) {
    return knex.select('*').from('notes');
  },
  insertNotes(knex, newNote) {
    return knex
      .insert(newNote)
      .into('notes')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex.from('notes').select('*').where('id', id).first();
  },
  deleteNote(knex, id) {
    return knex('notes')
      .where({ id })
      .delete();
  },
  updateNote(knex, id, newNoteFields) {
    return knex('notes')
      .update(newNoteFields)
      .where({ id });
          
  }
        
        
};
        
module.exports = notesService;