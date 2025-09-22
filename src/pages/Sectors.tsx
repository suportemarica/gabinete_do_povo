import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Users, Building, UserPlus, UserMinus } from 'lucide-react';
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
import { useGabineteData } from '@/hooks/useGabineteData';
import { Sector } from '@/types';
import { SectorViewer } from '@/components/sectors/SectorViewer';

export function Sectors() {
  const { sectors, setSectors } = useGabineteData();
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

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.responsibleUsers.some(user => 
      user.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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

  const handleSaveSector = () => {
    if (!formData.name.trim()) return;

    const sectorData: Sector = {
      id: isEditing && selectedSector ? selectedSector.id : `setor_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      responsibleUsers: formData.responsibleUsers,
      active: formData.active,
    };

    if (isEditing && selectedSector) {
      setSectors(prev => prev.map(s => s.id === selectedSector.id ? sectorData : s));
    } else {
      setSectors(prev => [...prev, sectorData]);
    }

    setIsSectorDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      responsibleUsers: [],
      active: true,
    });
  };

  const handleDeleteSector = (sector: Sector) => {
    setSectors(prev => prev.filter(s => s.id !== sector.id));
  };

  const handleToggleSector = (sector: Sector) => {
    setSectors(prev => prev.map(s => 
      s.id === sector.id ? { ...s, active: !s.active } : s
    ));
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
        <Button onClick={handleCreateSector} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
      </div>

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
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {filteredSectors.map((sector) => (
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
              ))}
            </TableBody>
          </Table>
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

