router.get('/', async (req, res) => {
    try {
        const query = {};
        
        // Handle type filter
        if (req.query.type) {
            query.type = req.query.type;
        }
        
        // Handle framework filter
        if (req.query.framework) {
            query.framework = req.query.framework;
        }
        
        // Handle associated skill filter
        if (req.query.associatedSkill) {
            const associations = await ResourceAssociation.find({
                destination: req.query.associatedSkill
            });
            const jobRoleIds = associations.map(assoc => assoc.source);
            query._id = { $in: jobRoleIds };
            query.type = 'job_role';
        }
        
        const definitions = await CompetencyDefinition.find(query)
            .populate('criteria')
            .populate('directAssociations')
            .populate('resourceAssociations');
            
        res.json(definitions);
    } catch (error) {
        console.error('Error fetching competency definitions:', error);
        res.status(500).json({ error: 'Error fetching competency definitions' });
    }
}); 