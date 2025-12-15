import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectFile, ConversationMessage, FileOperation } from '@/types/projectTypes';

// Note: This file uses type assertions (as any) because the Supabase types
// haven't been generated yet. Run `supabase gen types typescript` after
// applying the database migration to get proper types.

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
    file_operations: FileOperation[] | null;
    created_at: string;
}

// Type-safe database client wrapper
const db = {
    projects: () => (supabase as any).from('projects'),
    project_files: () => (supabase as any).from('project_files'),
    conversations: () => (supabase as any).from('conversations'),
};

// Convert DB project to app format
function dbToProject(dbData: DbProject): Project {
    return {
        id: dbData.id,
        name: dbData.name,
        description: dbData.description || undefined,
        createdAt: new Date(dbData.created_at),
        updatedAt: new Date(dbData.updated_at),
        userId: dbData.user_id || undefined,
    };
}

// Convert DB file to app format
function dbToProjectFile(dbData: DbProjectFile): ProjectFile {
    return {
        id: dbData.id,
        path: dbData.path,
        content: dbData.content,
        language: dbData.language as ProjectFile['language'],
        isEntryPoint: dbData.is_entry_point,
    };
}

// Convert DB conversation to app format
function dbToConversation(dbData: DbConversation): ConversationMessage {
    return {
        id: dbData.id,
        role: dbData.role,
        content: dbData.content,
        thought: dbData.thought || undefined,
        fileOperations: dbData.file_operations || undefined,
        timestamp: new Date(dbData.created_at),
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
        const { data: projectData, error: projectError } = await db.projects()
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
        const fileInserts = files.map(file => ({
            project_id: projectData.id,
            path: file.path,
            content: file.content,
            language: file.language,
            is_entry_point: file.isEntryPoint || false,
        }));

        const { data: filesData, error: filesError } = await db.project_files()
            .insert(fileInserts)
            .select();

        if (filesError) {
            console.error('Error creating files:', filesError);
            // Rollback project
            await db.projects().delete().eq('id', projectData.id);
            return null;
        }

        return {
            project: dbToProject(projectData as DbProject),
            files: (filesData as DbProjectFile[]).map(dbToProjectFile),
        };
    }

    // Get a project by ID with all files
    static async getProject(projectId: string): Promise<{
        project: Project;
        files: ProjectFile[];
        conversations: ConversationMessage[];
    } | null> {
        const { data: projectData, error: projectError } = await db.projects()
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError || !projectData) {
            console.error('Error fetching project:', projectError);
            return null;
        }

        const { data: filesData } = await db.project_files()
            .select('*')
            .eq('project_id', projectId)
            .order('path');

        const { data: conversationsData } = await db.conversations()
            .select('*')
            .eq('project_id', projectId)
            .order('created_at');

        return {
            project: dbToProject(projectData as DbProject),
            files: ((filesData || []) as DbProjectFile[]).map(dbToProjectFile),
            conversations: ((conversationsData || []) as DbConversation[]).map(dbToConversation),
        };
    }

    // Save project (update files)
    static async saveProject(
        projectId: string,
        files: ProjectFile[]
    ): Promise<boolean> {
        // Update project timestamp
        const { error: projectError } = await db.projects()
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);

        if (projectError) {
            console.error('Error updating project:', projectError);
            return false;
        }

        // Upsert files
        const fileUpserts = files.map(file => ({
            id: file.id || crypto.randomUUID(),
            project_id: projectId,
            path: file.path,
            content: file.content,
            language: file.language,
            is_entry_point: file.isEntryPoint || false,
        }));

        const { error: filesError } = await db.project_files()
            .upsert(fileUpserts, { onConflict: 'id' });

        if (filesError) {
            console.error('Error saving files:', filesError);
            return false;
        }

        // Delete files that no longer exist
        const fileIds = files.map(f => f.id).filter(Boolean);
        if (fileIds.length > 0) {
            await db.project_files()
                .delete()
                .eq('project_id', projectId)
                .not('id', 'in', `(${fileIds.join(',')})`);
        }

        return true;
    }

    // Add a conversation message
    static async addConversation(
        projectId: string,
        role: 'user' | 'assistant',
        content: string,
        thought?: string,
        fileOperations?: FileOperation[]
    ): Promise<ConversationMessage | null> {
        const { data, error } = await db.conversations()
            .insert({
                project_id: projectId,
                role,
                content,
                thought: thought || null,
                file_operations: fileOperations || null,
            })
            .select()
            .single();

        if (error || !data) {
            console.error('Error adding conversation:', error);
            return null;
        }

        return dbToConversation(data as DbConversation);
    }

    // Get user's projects
    static async getUserProjects(): Promise<Project[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return [];
        }

        const { data, error } = await db.projects()
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
            return [];
        }

        return ((data || []) as DbProject[]).map(dbToProject);
    }

    // Delete a project
    static async deleteProject(projectId: string): Promise<boolean> {
        const { error } = await db.projects()
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
        const { error } = await db.projects()
            .update({ name })
            .eq('id', projectId);

        if (error) {
            console.error('Error renaming project:', error);
            return false;
        }

        return true;
    }
}
