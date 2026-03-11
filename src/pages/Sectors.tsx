import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Users, Building, UserPlus, UserMinus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSectors } from '@/hooks/useSectors';
import { Sector } from '@/types';
import { SectorViewer } from '@/components/sectors/SectorViewer';
import { useToast } from '@/hooks/use-toast';

export function Sectors() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [isSectorDialogOpen, setIsSectorDialogOpen] = useState(false);
  const [isSectorViewerOpen, setIsSectorViewerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    responsibleUsers: [] as string[],
    active: true,
  });
  const [newUser, setNewUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  // Hook para gerenciar setores com API
  const {
    sectors,
    loading,
    error,
    pagination,
    createSector,
    updateSector,
    deleteSector,
    toggleSectorStatus,
    refreshSectors,
  } = useSectors({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    isActive: isActiveFilter,
  });

  // Buscar setores quando o termo de busca mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreateSector = () => {
    setFormData({
      name: '',
      description: '',
      responsibleUsers: [],
      active: true,
    });
    setIsEditing(false);
    setIsSectorDialogOpen(true);
  };

  const handleEditSector = (sector: Sector) => {
    setFormData({
      name: sector.name,
      description: sector.description,
      responsibleUsers: [...sector.responsibleUsers],
      active: sector.active,
    });
    setSelectedSector(sector);
    setIsEditing(true);
    setIsSectorDialogOpen(true);
  };

  const handleViewSector = (sector: Sector) => {
    setSelectedSector(sector);
    setIsSectorViewerOpen(true);
  };

  const handleSaveSector = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do setor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const sectorData = {
        name: formData.name,
        description: formData.description,
        isActive: formData.active,
      };

      if (isEditing && selectedSector) {
        const updatedSector = await updateSector(selectedSector.id, sectorData);
        if (updatedSector) {
          toast({
            title: "Sucesso",
            description: "Setor atualizado com sucesso",
          });
        }
      } else {
        const newSector = await createSector(sectorData);
        if (newSector) {
          toast({
            title: "Sucesso",
            description: "Setor criado com sucesso",
          });
        }
      }

      setIsSectorDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        responsibleUsers: [],
        active: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar setor",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSector = async (sector: Sector) => {
    if (window.confirm(`Tem certeza que deseja deletar o setor "${sector.name}"?`)) {
      const success = await deleteSector(sector.id);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Setor deletado com sucesso",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar setor",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleSector = async (sector: Sector) => {
    const updatedSector = await toggleSectorStatus(sector.id);
    if (updatedSector) {
      toast({
        title: "Sucesso",
        description: `Setor ${updatedSector.active ? 'ativado' : 'desativado'} com sucesso`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do setor",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = () => {
    if (newUser.trim() && !formData.responsibleUsers.includes(newUser.trim())) {
      setFormData(prev => ({
        ...prev,
        responsibleUsers: [...prev.responsibleUsers, newUser.trim()]
      }));
      setNewUser('');
    }
  };

  const handleRemoveUser = (user: string) => {
    setFormData(prev => ({
      ...prev,
      responsibleUsers: prev.responsibleUsers.filter(u => u !== user)
    }));
  };

  const getActiveSectorsCount = () => {
    return sectors.filter(s => s.active).length;
  };

  const getTotalUsersCount = () => {
    return sectors.reduce((total, sector) => total + sector.responsibleUsers.length, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Setores</h1>
          <p className="text-muted-foreground">
            Gerencie os setores responsáveis pelas tarefas do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={refreshSectors} 
            variant="outline" 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleCreateSector} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Setor
          </Button>
        </div>
      </div>

      {/* Exibir erro se houver */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Setores</p>
                <p className="text-2xl font-bold">{sectors.length}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Setores Ativos</p>
                <p className="text-2xl font-bold text-green-600">{getActiveSectorsCount()}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Responsáveis</p>
                <p className="text-2xl font-bold text-blue-600">{getTotalUsersCount()}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Setores Cadastrados</CardTitle>
              <CardDescription>
                Gerencie os setores e usuários responsáveis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar setores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsActiveFilter(undefined)}>
                    Todos os setores
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsActiveFilter(true)}>
                    Apenas ativos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsActiveFilter(false)}>
                    Apenas inativos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Carregando setores...</span>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsáveis</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum setor encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    sectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sector.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sector.active ? "default" : "secondary"}>
                      {sector.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {sector.responsibleUsers.length} usuário(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {sector.responsibleUsers.slice(0, 2).map((user, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {user}
                        </Badge>
                      ))}
                      {sector.responsibleUsers.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{sector.responsibleUsers.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewSector(sector)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSector(sector)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSector(sector)}>
                          {sector.active ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSector(sector)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} setores
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar setor */}
      <Dialog open={isSectorDialogOpen} onOpenChange={setIsSectorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Setor' : 'Novo Setor'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Edite as informações do setor selecionado'
                : 'Configure um novo setor para o sistema'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Setor</Label>
              <Input
                id="name"
                placeholder="Ex: Obras Públicas"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva as responsabilidades do setor"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label>Usuários Responsáveis</Label>
              <div className="space-y-2 mt-2">
                {formData.responsibleUsers.map((user, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1 justify-start">
                      <Users className="h-3 w-3 mr-1" />
                      {user}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(user)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do usuário..."
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddUser}
                    disabled={!newUser.trim()}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Setor Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Setores ativos podem receber tarefas
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, active: checked }))
                }
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsSectorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSector}
              disabled={!formData.name.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Setor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar setor */}
      {selectedSector && (
        <Dialog open={isSectorViewerOpen} onOpenChange={setIsSectorViewerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <SectorViewer 
              sector={selectedSector} 
              onClose={() => setIsSectorViewerOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

