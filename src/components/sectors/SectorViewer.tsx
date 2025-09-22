import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sector } from '@/types';
import { Building, Users, UserCheck, Calendar, Activity, CheckCircle, XCircle } from 'lucide-react';

interface SectorViewerProps {
  sector: Sector;
  onClose: () => void;
}

export function SectorViewer({ sector, onClose }: SectorViewerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{sector.name}</h2>
          <p className="text-muted-foreground">{sector.description}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Setor */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={sector.active ? "default" : "secondary"}>
                  {sector.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total de Usuários</span>
                <span className="text-sm text-muted-foreground">
                  {sector.responsibleUsers.length}
                </span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Descrição
                </h4>
                <p className="text-sm text-muted-foreground">
                  {sector.description || 'Nenhuma descrição fornecida'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Usuários Responsáveis */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usuários Responsáveis</CardTitle>
              <CardDescription>
                Pessoas responsáveis por este setor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sector.responsibleUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user}</p>
                        <p className="text-sm text-muted-foreground">Responsável</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      Ativo
                    </Badge>
                  </div>
                ))}
                
                {sector.responsibleUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário responsável</p>
                    <p className="text-sm">Adicione usuários para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas do Setor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {sector.responsibleUsers.length}
              </div>
              <div className="text-sm text-muted-foreground">Usuários Responsáveis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sector.active ? 'Sim' : 'Não'}
              </div>
              <div className="text-sm text-muted-foreground">Status Ativo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sector.name.length}
              </div>
              <div className="text-sm text-muted-foreground">Caracteres no Nome</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {sector.description.length}
              </div>
              <div className="text-sm text-muted-foreground">Caracteres na Descrição</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Detalhes do Setor
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{sector.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span>{sector.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={sector.active ? "default" : "secondary"} className="text-xs">
                    {sector.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Resumo
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Setor {sector.active ? 'ativo' : 'inativo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{sector.responsibleUsers.length} usuário(s) responsável(is)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-orange-600" />
                  <span>Setor do sistema Gabinete do Povo</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

