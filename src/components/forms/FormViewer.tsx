import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ApiForm, ApiFormQuestion } from '@/types/api';
import { Calendar, Clock, Globe, Key, FileText, CheckCircle, XCircle } from 'lucide-react';

interface FormViewerProps {
  form: ApiForm;
  onClose: () => void;
}

export function FormViewer({ form, onClose }: FormViewerProps) {
  const getQuestionTypeLabel = (type: ApiFormQuestion['type']) => {
    const labels = {
      text: 'Texto Livre',
      email: 'Email',
      number: 'Número',
      textarea: 'Texto Longo',
      select: 'Seleção Única',
      radio: 'Opção Única',
      checkbox: 'Múltipla Escolha',
      file: 'Arquivo',
      date: 'Data',
      time: 'Hora',
      datetime: 'Data e Hora',
      url: 'URL',
      phone: 'Telefone',
      cpf: 'CPF',
      cnpj: 'CNPJ',
      cep: 'CEP',
      scale: 'Escala',
      'matrix-radio': 'Matriz Radio',
      'matrix-checkbox': 'Matriz Checkbox',
      'table-dynamic': 'Tabela Dinâmica',
      'checkbox-quantity': 'Checkbox Quantidade',
      'coded-selection': 'Seleção Codificada',
      'composite-field': 'Campo Composto'
    };
    return labels[type] || type;
  };

  const getQuestionTypeIcon = (type: ApiFormQuestion['type']) => {
    switch (type) {
      case 'text':
      case 'textarea':
        return <FileText className="h-4 w-4" />;
      case 'select':
      case 'radio':
      case 'checkbox':
        return <CheckCircle className="h-4 w-4" />;
      case 'date':
      case 'time':
      case 'datetime':
        return <Calendar className="h-4 w-4" />;
      case 'email':
      case 'url':
        return <Globe className="h-4 w-4" />;
      case 'file':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{form.title}</h2>
          <p className="text-muted-foreground">{form.description}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Formulário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={form.status === 'active' ? "default" : "secondary"}>
                  {form.status === 'active' ? "Ativo" : 
                   form.status === 'inactive' ? "Inativo" :
                   form.status === 'draft' ? "Rascunho" : "Arquivado"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total de Perguntas</span>
                <span className="text-sm text-muted-foreground">
                  {form.questions.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Perguntas Obrigatórias</span>
                <span className="text-sm text-muted-foreground">
                  {form.questions.filter(q => q.required).length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Criado em</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(form.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Atualizado em</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(form.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Categoria
                </h4>
                <p className="text-sm text-muted-foreground">
                  {form.category || 'Sem categoria'}
                </p>
              </div>

              {form.instructions && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Instruções
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {form.instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Perguntas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perguntas do Formulário</CardTitle>
              <CardDescription>
                Visualize todas as perguntas configuradas para este formulário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{question.title}</span>
                        {question.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatória
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getQuestionTypeIcon(question.type)}
                        <span className="text-sm text-muted-foreground">
                          {getQuestionTypeLabel(question.type)}
                        </span>
                      </div>
                    </div>

                    {question.description && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          {question.description}
                        </p>
                      </div>
                    )}

                    {question.options && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Opções:</p>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            // Tratar options que podem vir como string JSON ou array
                            let optionsArray: any[] = [];
                            if (Array.isArray(question.options)) {
                              optionsArray = question.options;
                            } else if (typeof question.options === 'string') {
                              try {
                                const parsed = JSON.parse(question.options);
                                optionsArray = Array.isArray(parsed) ? parsed : [];
                              } catch (e) {
                                console.warn('Erro ao fazer parse das opções:', e);
                                optionsArray = [];
                              }
                            }
                            
                            return optionsArray.length > 0 ? (
                              optionsArray.map((option: any, optionIndex: number) => (
                                <Badge key={optionIndex} variant="outline" className="text-xs">
                                  {option?.value || option || 'Opção inválida'}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Nenhuma opção configurada</span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {form.questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma pergunta configurada</p>
                    <p className="text-sm">Adicione perguntas para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas do Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {form.questions.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Perguntas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {form.questions.filter(q => q.required).length}
              </div>
              <div className="text-sm text-muted-foreground">Obrigatórias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {form.questions.filter(q => q.type === 'select' || q.type === 'multiselect').length}
              </div>
              <div className="text-sm text-muted-foreground">Com Opções</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {form.questions.filter(q => q.type === 'text').length}
              </div>
              <div className="text-sm text-muted-foreground">Texto Livre</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
