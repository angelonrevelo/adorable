import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectFile, ConversationMessage } from '@/types/projectTypes';

// Note: TypeScript errors about table names are expected until the database
// schema is applied and types are regenerated with `supabase gen types`.
// The runtime code will work correctly once tables exist.

// Database types (matching Supabase schema)
interface DbProject {
    id: string;
    user_id: string | null;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

interface DbProjectFile {
    id: string;
    project_id: string;
    path: string;
    content: string;
    language: string;
    is_entry_point: boolean;
    created_at: string;
    updated_at: string;
}

interface DbConversation {
    id: string;
    project_id: string;
    role: 'user' | 'assistant';
    content: string;
    thought: string | null;
    file_operations: any | null;
    created_at: string;
}

// Convert DB project to app format
function dbToProject(db: DbProject): Project {
    return {
        id: db.id,
        name: db.name,
        description: db.description || undefined,
        createdAt: new Date(db.created_at),
        updatedAt: new Date(db.updated_at),
        userId: db.user_id || undefined,
    };
}

// Convert DB file to app format
function dbToProjectFile(db: DbProjectFile): ProjectFile {
    return {
        id: db.id,
        path: db.path,
        content: db.content,
        language: db.language as ProjectFile['language'],
        isEntryPoint: db.is_entry_point,
    };
}

// Convert DB conversation to app format
function dbToConversation(db: DbConversation): ConversationMessage {
    return {
        id: db.id,
        role: db.role,
        content: db.content,
        thought: db.thought || undefined,
        fileOperations: db.file_operations || undefined,
        timestamp: new Date(db.created_at),
    };
}

export class ProjectService {
    // Create a new project
    static async createProject(
        name: string,
        files: Omit<ProjectFile, 'id'>[],
        description?: string
    ): Promise<{ project: Project; files: ProjectFile[] } | null> {
        const { data: { user } } = await supabase.auth.getUser();

        // Insert project
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert({
                name,
                description,
                user_id: user?.id || null,
            })
            .select()
            .single();

        if (projectError || !projectData) {
            console.error('Error creating project:', projectError);
            return null;
        }

        // Insert files
        const filesToInsert = files.map(file => ({
            project_id: projectData.id,
            path: file.path,
            content: file.content,
            language: file.language,
            is_entry_point: file.isEntryPoint || false,
        }));

        const { data: filesData, error: filesError } = await supabase
            .from('project_files')
            .insert(filesToInsert)
            .select();

        if (filesError) {
            console.error('Error creating files:', filesError);
            // Rollback project
            await supabase.from('projects').delete().eq('id', projectData.id);
            return null;
        }

        return {
            project: dbToProject(projectData as DbProject),
            files: (filesData as DbProjectFile[]).map(dbToProjectFile),
        };
    }

    // Load a project by ID
    static async loadProject(projectId: string): Promise<{
        project: Project;
        files: ProjectFile[];
        conversations: ConversationMessage[];
    } | null> {
        // Fetch project
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError || !projectData) {
            console.error('Error loading project:', projectError);
            return null;
        }

        // Fetch files
        const { data: filesData, error: filesError } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId)
            .order('path');

        if (filesError) {
            console.error('Error loading files:', filesError);
            return null;
        }

        // Fetch conversations
        const { data: conversationsData, error: conversationsError } = await supabase
            .from('conversations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at');

        if (conversationsError) {
            console.error('Error loading conversations:', conversationsError);
            // Continue without conversations
        }

        return {
            project: dbToProject(projectData as DbProject),
            files: (filesData as DbProjectFile[]).map(dbToProjectFile),
            conversations: (conversationsData as DbConversation[] || []).map(dbToConversation),
        };
    }

    // Save project files (update existing or insert new)
    static async saveProjectFiles(
        projectId: string,
        files: ProjectFile[]
    ): Promise<boolean> {
        // Update project timestamp
        await supabase
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);

        // Upsert files
        const filesToUpsert = files.map(file => ({
            id: file.id,
            project_id: projectId,
            path: file.path,
            content: file.content,
            language: file.language,
            is_entry_point: file.isEntryPoint || false,
        }));

        const { error } = await supabase
            .from('project_files')
            .upsert(filesToUpsert, { onConflict: 'project_id,path' });

        if (error) {
            console.error('Error saving files:', error);
            return false;
        }

        return true;
    }

    // Delete a file from the project
    static async deleteProjectFile(projectId: string, path: string): Promise<boolean> {
        const { error } = await supabase
            .from('project_files')
            .delete()
            .eq('project_id', projectId)
            .eq('path', path);

        if (error) {
            console.error('Error deleting file:', error);
            return false;
        }

        return true;
    }

    // Save a conversation message
    static async saveConversation(
        projectId: string,
        message: Omit<ConversationMessage, 'id' | 'timestamp'>
    ): Promise<ConversationMessage | null> {
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                project_id: projectId,
                role: message.role,
                content: message.content,
                thought: message.thought || null,
                file_operations: message.fileOperations || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving conversation:', error);
            return null;
        }

        return dbToConversation(data as DbConversation);
    }

    // List all projects for the current user
    static async listProjects(): Promise<Project[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Return empty for anonymous users
            return [];
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error listing projects:', error);
            return [];
        }

        return (data as DbProject[]).map(dbToProject);
    }

    // Delete a project
    static async deleteProject(projectId: string): Promise<boolean> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) {
            console.error('Error deleting project:', error);
            return false;
        }

        return true;
    }

    // Rename a project
    static async renameProject(projectId: string, name: string): Promise<boolean> {
        const { error } = await supabase
            .from('projects')
            .update({ name })
            .eq('id', projectId);

        if (error) {
            console.error('Error renaming project:', error);
            return false;
        }

        return true;
    }

    // Check if user is authenticated
    static async isAuthenticated(): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    }

    // Get current user
    static async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
}
